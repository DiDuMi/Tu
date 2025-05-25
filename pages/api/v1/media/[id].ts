import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api'
import { z } from 'zod'
import { formatMediaInfo } from '@/lib/media'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import fs from 'fs/promises'
import path from 'path'

// 更新媒体信息验证模式
const updateMediaSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符').optional(),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
})

/**
 * 媒体详情处理函数
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的媒体ID',
      undefined,
      400
    )
  }

  // 获取当前用户会话
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user) {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      '未授权访问',
      undefined,
      401
    )
  }

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true, role: true },
  })

  if (!user) {
    return errorResponse(
      res,
      'USER_NOT_FOUND',
      '用户不存在',
      undefined,
      404
    )
  }

  // 查询媒体
  const media = await prisma.media.findUnique({
    where: { uuid: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      versions: {
        select: {
          thumbnailUrl: true,
        },
        orderBy: {
          versionNumber: 'desc',
        },
        take: 1, // 只获取最新版本
      },
    },
  })

  if (!media) {
    return notFoundResponse(res, '媒体不存在')
  }

  // 检查权限（只有媒体所有者或管理员可以修改/删除媒体）
  const isOwner = media.userId === user.id
  const isAdmin = user.role === 'ADMIN' || user.role === 'OPERATOR'
  const hasPermission = isOwner || isAdmin

  // GET方法：获取媒体详情
  if (req.method === 'GET') {
    return successResponse(res, formatMediaInfo(media))
  }

  // PUT方法：更新媒体信息
  if (req.method === 'PUT') {
    if (!hasPermission) {
      return errorResponse(
        res,
        'FORBIDDEN',
        '您没有权限修改此媒体',
        undefined,
        403
      )
    }

    try {
      // 验证请求数据
      const validation = updateMediaSchema.safeParse(req.body)
      if (!validation.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validation.error.format(),
          400
        )
      }

      const { title, description } = validation.data

      // 更新媒体信息
      const updatedMedia = await prisma.media.update({
        where: { uuid: id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return successResponse(res, formatMediaInfo(updatedMedia), '媒体信息更新成功')
    } catch (error) {
      console.error('更新媒体信息失败:', error)
      return errorResponse(
        res,
        'UPDATE_FAILED',
        '更新媒体信息失败',
        error instanceof Error ? error.message : undefined,
        500
      )
    }
  }

  // DELETE方法：删除媒体
  if (req.method === 'DELETE') {
    if (!hasPermission) {
      return errorResponse(
        res,
        'FORBIDDEN',
        '您没有权限删除此媒体',
        undefined,
        403
      )
    }

    try {
      // 检查媒体是否被引用
      // 这里应该根据实际项目结构检查所有可能引用媒体的表
      // 例如：Page表中的content字段可能包含媒体引用
      const mediaUrl = media.url;

      // 检查Page表中的content是否引用了该媒体
      const referencingPages = await prisma.page.count({
        where: {
          OR: [
            { content: { contains: mediaUrl } },
            { contentBlocks: { contains: mediaUrl } }
          ],
          deletedAt: null
        }
      });

      if (referencingPages > 0) {
        return errorResponse(
          res,
          'MEDIA_IN_USE',
          '该媒体正在被内容引用，无法删除',
          { referencingCount: referencingPages },
          409 // Conflict
        )
      }

      // 软删除媒体记录
      await prisma.media.update({
        where: { uuid: id },
        data: {
          deletedAt: new Date(),
        },
      })

      // 尝试删除物理文件（如果存在）
      let fileDeleted = true;
      try {
        const filePath = path.join(process.cwd(), 'public', media.url)
        await fs.access(filePath)
        await fs.unlink(filePath)
      } catch (fileError) {
        // 记录文件删除失败，但不阻止API成功响应
        console.warn('删除媒体文件失败:', fileError)
        fileDeleted = false;
      }

      return successResponse(
        res,
        {
          success: true,
          fileDeleted: fileDeleted
        },
        fileDeleted ? '媒体删除成功' : '媒体记录已删除，但物理文件删除失败'
      )
    } catch (error) {
      console.error('删除媒体失败:', error)
      return errorResponse(
        res,
        'DELETE_FAILED',
        '删除媒体失败',
        error instanceof Error ? error.message : undefined,
        500
      )
    }
  }

  // 不支持的请求方法
  return errorResponse(
    res,
    'METHOD_NOT_ALLOWED',
    '不支持的请求方法',
    undefined,
    405
  )
}

export default withErrorHandler(withAuth(handler))
