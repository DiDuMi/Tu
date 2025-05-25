import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { generateTagSlug } from '@/lib/content'

// 更新标签验证模式
const updateTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过50个字符'),
  slug: z.string().optional(),
  description: z.string().optional(),
})

// 合并标签验证模式
const mergeTagSchema = z.object({
  targetTagId: z.number(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的标签ID',
      undefined,
      422
    )
  }

  // 查找标签 - 支持通过uuid或slug查找
  const tag = await prisma.tag.findFirst({
    where: {
      OR: [
        { uuid: id },
        { slug: id }
      ]
    },
  })

  if (!tag) {
    return errorResponse(
      res,
      'NOT_FOUND',
      '标签不存在',
      undefined,
      404
    )
  }

  // GET 请求 - 获取标签详情
  if (req.method === 'GET') {
    try {
      // 查询标签详情（包含关联数据）
      const tagDetail = await prisma.tag.findUnique({
        where: { id: tag.id },
        include: {
          _count: {
            select: {
              pageTags: true,
            },
          },
        },
      })

      return successResponse(res, tagDetail)
    } catch (error) {
      console.error('获取标签详情失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取标签详情失败',
        undefined,
        500
      )
    }
  }

  // PUT 请求 - 更新标签
  else if (req.method === 'PUT') {
    try {
      // 检查用户是否已登录
      if (!session) {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          '未授权操作',
          undefined,
          401
        )
      }

      // 检查权限（只有管理员/操作员可以更新标签）
      if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权更新标签',
          undefined,
          403
        )
      }

      // 验证请求数据
      const validationResult = updateTagSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, slug, description } = validationResult.data

      // 检查标签名称是否已存在（排除自己）
      const existingTag = await prisma.tag.findFirst({
        where: {
          name,
          id: { not: tag.id },
        },
      })

      if (existingTag) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '标签名称已存在',
          undefined,
          422
        )
      }

      // 生成 slug
      const tagSlug = slug || generateTagSlug(name)

      // 检查 slug 是否已存在（排除自己）
      const existingSlug = await prisma.tag.findFirst({
        where: {
          slug: tagSlug,
          id: { not: tag.id },
        },
      })

      if (existingSlug) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '标签别名已存在',
          undefined,
          422
        )
      }

      // 更新标签
      const updatedTag = await prisma.tag.update({
        where: { id: tag.id },
        data: {
          name,
          slug: tagSlug,
          description,
        },
      })

      return successResponse(res, updatedTag, '标签更新成功')
    } catch (error) {
      console.error('更新标签失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新标签失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 合并标签
  else if (req.method === 'POST') {
    try {
      // 检查用户是否已登录
      if (!session) {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          '未授权操作',
          undefined,
          401
        )
      }

      // 检查权限（只有管理员/操作员可以合并标签）
      if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权合并标签',
          undefined,
          403
        )
      }

      // 验证请求数据
      const validationResult = mergeTagSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { targetTagId } = validationResult.data

      // 检查目标标签是否存在
      const targetTag = await prisma.tag.findUnique({
        where: { id: targetTagId },
      })

      if (!targetTag) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '目标标签不存在',
          undefined,
          422
        )
      }

      // 不能合并到自己
      if (targetTagId === tag.id) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '不能将标签合并到自己',
          undefined,
          422
        )
      }

      // 查找当前标签关联的内容
      const pageTags = await prisma.pageTag.findMany({
        where: { tagId: tag.id },
        select: { pageId: true },
      })

      // 查找目标标签关联的内容
      const targetPageTags = await prisma.pageTag.findMany({
        where: { tagId: targetTagId },
        select: { pageId: true },
      })

      // 找出需要新增关联的内容（在当前标签中有但在目标标签中没有的）
      const targetPageIds = new Set(targetPageTags.map(pt => pt.pageId))
      const newPageTags = pageTags.filter(pt => !targetPageIds.has(pt.pageId))

      // 创建新的关联
      if (newPageTags.length > 0) {
        // 使用循环创建关联，避免使用可能不支持的 skipDuplicates 选项
        for (const pt of newPageTags) {
          // 检查是否已存在关联
          const existingRelation = await prisma.pageTag.findFirst({
            where: {
              pageId: pt.pageId,
              tagId: targetTagId
            }
          });

          // 如果不存在，则创建
          if (!existingRelation) {
            await prisma.pageTag.create({
              data: {
                pageId: pt.pageId,
                tagId: targetTagId,
              }
            });
          }
        }
      }

      // 更新目标标签的使用次数
      await prisma.tag.update({
        where: { id: targetTagId },
        data: {
          useCount: { increment: newPageTags.length },
        },
      })

      // 删除当前标签的所有关联
      await prisma.pageTag.deleteMany({
        where: { tagId: tag.id },
      })

      // 删除当前标签
      await prisma.tag.delete({
        where: { id: tag.id },
      })

      return successResponse(res, {
        sourceTagId: tag.id,
        targetTagId,
        mergedCount: newPageTags.length,
      }, '标签合并成功')
    } catch (error) {
      console.error('合并标签失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '合并标签失败',
        undefined,
        500
      )
    }
  }

  // DELETE 请求 - 删除标签
  else if (req.method === 'DELETE') {
    try {
      // 检查用户是否已登录
      if (!session) {
        return errorResponse(
          res,
          'UNAUTHORIZED',
          '未授权操作',
          undefined,
          401
        )
      }

      // 检查权限（只有管理员/操作员可以删除标签）
      if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权删除标签',
          undefined,
          403
        )
      }

      // 删除标签关联
      await prisma.pageTag.deleteMany({
        where: { tagId: tag.id },
      })

      // 删除标签
      await prisma.tag.delete({
        where: { id: tag.id },
      })

      return successResponse(res, { id }, '标签删除成功')
    } catch (error) {
      console.error('删除标签失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '删除标签失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  else {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
