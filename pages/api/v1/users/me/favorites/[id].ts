import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions)

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

  // 获取内容ID
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的内容ID',
      undefined,
      422
    )
  }

  // 查找内容
  const page = await prisma.page.findUnique({
    where: { uuid: id },
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

  // DELETE 请求 - 取消收藏
  if (req.method === 'DELETE') {
    try {
      // 查找收藏记录
      const favorite = await prisma.favorite.findFirst({
        where: {
          userId: parseInt(session.user.id),
          pageId: page.id,
        },
      })

      if (!favorite) {
        return errorResponse(
          res,
          'NOT_FOUND',
          '未找到收藏记录',
          undefined,
          404
        )
      }

      // 删除收藏记录
      await prisma.favorite.delete({
        where: {
          id: favorite.id,
        },
      })

      // 返回成功响应
      return successResponse(res, { success: true }, '取消收藏成功')
    } catch (error) {
      console.error('取消收藏失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '取消收藏失败',
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

export default withErrorHandler(handler)
