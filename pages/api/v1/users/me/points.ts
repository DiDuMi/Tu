import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 获取用户积分信息
 * GET /api/v1/users/me/points
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

      // 获取用户积分信息
      const userPoint = await prisma.userPoint.findUnique({
        where: { userId: user.id },
        select: {
          balance: true,
          totalEarned: true,
          totalSpent: true,
          updatedAt: true
        }
      })

      // 如果用户没有积分记录，创建一个
      if (!userPoint) {
        const newUserPoint = await prisma.userPoint.create({
          data: {
            userId: user.id,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0
          },
          select: {
            balance: true,
            totalEarned: true,
            totalSpent: true,
            updatedAt: true
          }
        })

        return successResponse(res, {
          balance: newUserPoint.balance,
          totalEarned: newUserPoint.totalEarned,
          totalSpent: newUserPoint.totalSpent,
          lastSignIn: null
        })
      }

      // 获取最近的签到记录
      const lastSignIn = await prisma.signInRecord.findFirst({
        where: { userId: user.id },
        orderBy: { signInDate: 'desc' },
        select: { signInDate: true }
      })

      return successResponse(res, {
        balance: userPoint.balance,
        totalEarned: userPoint.totalEarned,
        totalSpent: userPoint.totalSpent,
        lastSignIn: lastSignIn?.signInDate || null
      })
    } catch (error) {
      console.error('获取用户积分信息失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户积分信息失败',
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
