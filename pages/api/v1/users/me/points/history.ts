import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 获取用户积分历史记录
 * GET /api/v1/users/me/points/history
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

      // 获取用户积分账户
      const userPoint = await prisma.userPoint.findUnique({
        where: { userId: user.id }
      })

      if (!userPoint) {
        return successResponse(res, {
          items: [],
          pagination: {
            page,
            limit,
            totalItems: 0,
            totalPages: 0
          }
        })
      }

      // 查询积分交易历史总数
      const totalItems = await prisma.pointTransaction.count({
        where: { userPointId: userPoint.id }
      })

      // 查询积分交易历史
      const transactions = await prisma.pointTransaction.findMany({
        where: { userPointId: userPoint.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          uuid: true,
          amount: true,
          type: true,
          description: true,
          metadata: true,
          createdAt: true
        }
      })

      const totalPages = Math.ceil(totalItems / limit)

      return successResponse(res, {
        items: transactions,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages
        }
      })
    } catch (error) {
      console.error('获取积分历史失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取积分历史失败',
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
