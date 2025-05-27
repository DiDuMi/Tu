import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 外部程序签到API
 * POST /api/v1/signin/external
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  try {
    const { api_key, user_identifier, source = 'api', extra_data } = req.body

    // 验证必需参数
    if (!api_key || !user_identifier) {
      return errorResponse(res, 'INVALID_INPUT', 'API密钥和用户标识符不能为空', undefined, 400)
    }

    // 验证API密钥
    const hashedApiKey = crypto.createHash('sha256').update(api_key).digest('hex')
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { 
        apiKey: hashedApiKey,
        isActive: true
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, status: true }
        }
      }
    })

    if (!apiKeyRecord) {
      return errorResponse(res, 'INVALID_API_KEY', 'API密钥无效或已过期', undefined, 401)
    }

    // 检查API密钥是否过期
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt <= new Date()) {
      return errorResponse(res, 'API_KEY_EXPIRED', 'API密钥已过期', undefined, 401)
    }

    // 检查权限
    const permissions = JSON.parse(apiKeyRecord.permissions)
    if (!permissions.includes('signin')) {
      return errorResponse(res, 'INSUFFICIENT_PERMISSIONS', 'API密钥没有签到权限', undefined, 403)
    }

    // 根据用户标识符查找用户
    let targetUser
    if (user_identifier.startsWith('telegram:')) {
      // Telegram用户ID格式: telegram:123456789
      const telegramId = user_identifier.replace('telegram:', '')
      targetUser = await prisma.user.findFirst({
        where: {
          telegramId: telegramId,
          deletedAt: null
        },
        select: { id: true, email: true, name: true, status: true }
      })
    } else if (user_identifier.includes('@')) {
      // 邮箱格式
      targetUser = await prisma.user.findUnique({
        where: {
          email: user_identifier,
          deletedAt: null
        },
        select: { id: true, email: true, name: true, status: true }
      })
    } else {
      // 用户ID格式
      const userId = parseInt(user_identifier)
      if (isNaN(userId)) {
        return errorResponse(res, 'INVALID_USER_IDENTIFIER', '用户标识符格式错误', undefined, 400)
      }
      targetUser = await prisma.user.findUnique({
        where: {
          id: userId,
          deletedAt: null
        },
        select: { id: true, email: true, name: true, status: true }
      })
    }

    if (!targetUser) {
      return errorResponse(res, 'USER_NOT_FOUND', '用户不存在', undefined, 404)
    }

    // 检查用户状态
    if (targetUser.status !== 'ACTIVE') {
      return errorResponse(res, 'USER_INACTIVE', '用户账号未激活', undefined, 403)
    }

    // 检查今天是否已经签到
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySignIn = await prisma.signInRecord.findFirst({
      where: {
        userId: targetUser.id,
        signInDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (todaySignIn) {
      return errorResponse(res, 'ALREADY_SIGNED_IN', '今天已经签到过了', undefined, 400)
    }

    // 计算连续签到天数（与原有逻辑相同）
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const yesterdaySignIn = await prisma.signInRecord.findFirst({
      where: {
        userId: targetUser.id,
        signInDate: {
          gte: yesterday,
          lt: today
        }
      }
    })

    let continuousDays = 1
    if (yesterdaySignIn) {
      const recentSignIns = await prisma.signInRecord.findMany({
        where: { userId: targetUser.id },
        orderBy: { signInDate: 'desc' },
        take: 30
      })

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

    // 计算奖励积分
    let pointsEarned = 5
    if (continuousDays >= 7) {
      pointsEarned += 10
    } else if (continuousDays >= 3) {
      pointsEarned += 5
    }

    // 获取客户端IP和User-Agent
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']

    // 使用事务处理签到和积分更新
    const result = await prisma.$transaction(async (tx) => {
      // 创建签到记录
      await tx.signInRecord.create({
        data: {
          userId: targetUser.id,
          continuousDays,
          pointsEarned,
          source,
          ipAddress: Array.isArray(clientIp) ? clientIp[0] : clientIp?.toString(),
          userAgent: userAgent?.toString(),
          apiKeyId: apiKeyRecord.id,
          extraData: extra_data ? JSON.stringify(extra_data) : null
        }
      })

      // 更新用户积分
      const userPoint = await tx.userPoint.upsert({
        where: { userId: targetUser.id },
        update: {
          balance: { increment: pointsEarned },
          totalEarned: { increment: pointsEarned }
        },
        create: {
          userId: targetUser.id,
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
          description: `外部签到奖励（${source}，连续${continuousDays}天）`
        }
      })

      // 更新API密钥使用统计
      await tx.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 }
        }
      })

      return { userPoint, continuousDays, pointsEarned }
    })

    return successResponse(res, {
      user_id: targetUser.id,
      continuous_days: result.continuousDays,
      points_earned: result.pointsEarned,
      current_points: result.userPoint.balance,
      source,
      rewards: [
        {
          type: 'points',
          amount: result.pointsEarned,
          reason: `连续签到${result.continuousDays}天奖励`
        }
      ]
    }, '签到成功')
  } catch (error) {
    console.error('外部签到失败:', error)
    return errorResponse(res, 'SERVER_ERROR', '签到失败', undefined, 500)
  }
}

export default handler
