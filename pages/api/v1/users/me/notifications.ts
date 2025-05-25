import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 获取用户通知列表
 * GET /api/v1/users/me/notifications
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证用户登录状态
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      '请先登录',
      undefined,
      401
    )
  }

  if (req.method === 'GET') {
    try {
      // 获取当前用户
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
          deletedAt: null
        },
        select: { id: true }
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

      // 获取分页参数
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      // 由于当前数据库模型中没有通知表，我们返回一些模拟数据
      // 在实际项目中，这里应该查询真实的通知表
      const mockNotifications = [
        {
          id: 1,
          message: '欢迎使用兔图内容管理平台！',
          type: 'SYSTEM',
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          message: '您的内容已通过审核并发布',
          type: 'CONTENT',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ]

      // 模拟分页
      const totalItems = mockNotifications.length
      const totalPages = Math.ceil(totalItems / limit)
      const items = mockNotifications.slice(offset, offset + limit)
      const unreadCount = mockNotifications.filter(n => !n.read).length

      return successResponse(res, {
        items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        },
        unreadCount
      })
    } catch (error) {
      console.error('获取用户通知失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户通知失败',
        undefined,
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

export default handler
