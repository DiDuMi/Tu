import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id, versionUuid } = req.query

  if (!id || typeof id !== 'string' || !versionUuid || typeof versionUuid !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的内容ID或版本ID',
      undefined,
      422
    )
  }

  // 查找内容
  const page = await prisma.page.findUnique({
    where: { uuid: id },
    select: {
      id: true,
      userId: true,
    },
  })

  if (!page) {
    return errorResponse(
      res,
      'NOT_FOUND',
      '内容不存在',
      undefined,
      404
    )
  }

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

  // 检查权限（只有作者或管理员/操作员可以查看版本历史）
  if (parseInt(session.user.id) !== page.userId &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '无权查看此内容的版本历史',
      undefined,
      403
    )
  }

  // GET 请求 - 获取版本详情
  if (req.method === 'GET') {
    try {
      // 查询版本详情
      const version = await prisma.pageVersion.findFirst({
        where: {
          uuid: versionUuid,
          pageId: page.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })

      if (!version) {
        return errorResponse(
          res,
          'NOT_FOUND',
          '版本不存在',
          undefined,
          404
        )
      }

      return successResponse(res, version)
    } catch (error) {
      console.error('获取版本详情失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取版本详情失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 恢复到此版本
  else if (req.method === 'POST') {
    try {
      // 查询版本详情
      const version = await prisma.pageVersion.findFirst({
        where: {
          uuid: versionUuid,
          pageId: page.id,
        },
      })

      if (!version) {
        return errorResponse(
          res,
          'NOT_FOUND',
          '版本不存在',
          undefined,
          404
        )
      }

      // 更新内容为此版本
      await prisma.page.update({
        where: { id: page.id },
        data: {
          title: version.title,
          content: version.content,
          contentBlocks: version.contentBlocks,
          updatedAt: new Date(),
        },
      })

      // 获取当前版本号
      const latestVersion = await prisma.pageVersion.findFirst({
        where: { pageId: page.id },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      })

      const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

      // 创建新版本记录
      await prisma.pageVersion.create({
        data: {
          pageId: page.id,
          userId: parseInt(session.user.id),
          title: version.title,
          content: version.content,
          contentBlocks: version.contentBlocks,
          versionNumber: newVersionNumber,
          changeLog: `恢复到版本 ${version.versionNumber}`,
        },
      })

      return successResponse(res, { success: true }, '已恢复到指定版本')
    } catch (error) {
      console.error('恢复版本失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '恢复版本失败',
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
