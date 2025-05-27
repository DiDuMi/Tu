import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 用户每日签到
 * POST /api/v1/users/me/signin
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

  if (req.method === 'POST') {
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

      if (todaySignIn) {
        return errorResponse(
          res,
          'ALREADY_SIGNED_IN',
          '今天已经签到过了',
          undefined,
          400
        )
      }

      // 检查昨天是否签到（用于计算连续签到）
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const dayBeforeYesterday = new Date(yesterday)
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1)

      const yesterdaySignIn = await prisma.signInRecord.findFirst({
        where: {
          userId: user.id,
          signInDate: {
            gte: yesterday,
            lt: today
          }
        }
      })

      // 计算连续签到天数
      let continuousDays = 1
      if (yesterdaySignIn) {
        // 如果昨天有签到，查询最近的连续签到记录
        const recentSignIns = await prisma.signInRecord.findMany({
          where: { userId: user.id },
          orderBy: { signInDate: 'desc' },
          take: 30 // 最多查询30天
        })

        // 计算连续天数
        for (let i = 0; i < recentSignIns.length; i++) {
          const signInDate = new Date(recentSignIns[i].signInDate)
          signInDate.setHours(0, 0, 0, 0)

          const expectedDate = new Date(today)
          expectedDate.setDate(expectedDate.getDate() - (i + 1))

          if (signInDate.getTime() === expectedDate.getTime()) {
            continuousDays++
          } else {
            break
          }
        }
      }

      // 计算奖励积分（基础5分 + 连续签到奖励）
      let pointsEarned = 5
      if (continuousDays >= 7) {
        pointsEarned += 10 // 连续7天额外奖励10分
      } else if (continuousDays >= 3) {
        pointsEarned += 5 // 连续3天额外奖励5分
      }

      // 使用事务处理签到和积分更新
      const result = await prisma.$transaction(async (tx) => {
        // 创建签到记录
        await tx.signInRecord.create({
          data: {
            userId: user.id,
            continuousDays,
            pointsEarned
          }
        })

        // 更新用户积分
        const userPoint = await tx.userPoint.upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: pointsEarned },
            totalEarned: { increment: pointsEarned }
          },
          create: {
            userId: user.id,
            balance: pointsEarned,
            totalEarned: pointsEarned,
            totalSpent: 0
          }
        })

        // 创建积分交易记录
        await tx.pointTransaction.create({
          data: {
            userPointId: userPoint.id,
            amount: pointsEarned,
            type: 'SIGN_IN',
            description: `每日签到奖励（连续${continuousDays}天）`
          }
        })

        return { userPoint, continuousDays, pointsEarned }
      })

      return successResponse(res, {
        continuousDays: result.continuousDays,
        pointsEarned: result.pointsEarned,
        currentPoints: result.userPoint.balance
      }, '签到成功')
    } catch (error) {
      console.error('签到失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '签到失败',
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
