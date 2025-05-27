import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 获取用户签到状态
 * GET /api/v1/users/me/signin/status
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
          email: session.user.email!
        },
        select: { id: true, deletedAt: true }
      })

      // 检查用户是否存在且未被删除
      if (!user || user.deletedAt) {
        return errorResponse(
          res,
          'USER_NOT_FOUND',
          '用户不存在或已被删除',
          undefined,
          404
        )
      }

      // 检查今天是否已经签到
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todaySignIn = await prisma.signInRecord.findFirst({
        where: {
          userId: user.id,
          signInDate: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      // 获取最近的签到记录（用于显示连续签到天数）
      const latestSignIn = await prisma.signInRecord.findFirst({
        where: { userId: user.id },
        orderBy: { signInDate: 'desc' }
      })

      return successResponse(res, {
        canSignIn: !todaySignIn,
        signedInToday: !!todaySignIn,
        continuousDays: latestSignIn?.continuousDays || 0,
        lastSignInDate: latestSignIn?.signInDate || null
      })
    } catch (error) {
      console.error('获取签到状态失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取签到状态失败',
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
