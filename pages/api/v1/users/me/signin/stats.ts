import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 用户签到统计API
 * GET /api/v1/users/me/signin/stats
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  // 验证用户登录状态
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return errorResponse(res, 'UNAUTHORIZED', '请先登录', undefined, 401)
  }

  // 获取当前用户
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email!
    },
    select: { id: true, deletedAt: true }
  })

  // 检查用户是否存在且未被删除
  if (!user || user.deletedAt) {
    return errorResponse(res, 'USER_NOT_FOUND', '用户不存在或已被删除', undefined, 404)
  }

  try {
    // 获取所有签到记录
    const signInRecords = await prisma.signInRecord.findMany({
      where: { userId: user.id },
      orderBy: { signInDate: 'desc' }
    })

    // 计算基础统计
    const totalSignIns = signInRecords.length
    const totalPointsFromSignIn = signInRecords.reduce((sum, record) => sum + record.pointsEarned, 0)

    // 计算当前连续签到天数
    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < signInRecords.length; i++) {
      const signInDate = new Date(signInRecords[i].signInDate)
      signInDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (signInDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // 计算最长连续签到天数
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    for (const record of signInRecords.reverse()) {
      const signInDate = new Date(record.signInDate)
      signInDate.setHours(0, 0, 0, 0)

      if (lastDate) {
        const dayDiff = Math.floor((signInDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        if (dayDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      } else {
        tempStreak = 1
      }

      lastDate = signInDate
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // 计算签到率（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const recentSignIns = signInRecords.filter(record => {
      const signInDate = new Date(record.signInDate)
      return signInDate >= thirtyDaysAgo
    })

    const signInRate = recentSignIns.length / 30

    // 分析最常签到的时间段
    const hourCounts: { [key: string]: number } = {}
    signInRecords.forEach(record => {
      const hour = new Date(record.signInDate).getHours()
      const timeRange = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`
      hourCounts[timeRange] = (hourCounts[timeRange] || 0) + 1
    })

    const favoriteTime = Object.entries(hourCounts).reduce((a, b) =>
      hourCounts[a[0]] > hourCounts[b[0]] ? a : b
    )?.[0] || '未知'

    // 按来源统计
    const sourceStats: { [key: string]: number } = {}
    signInRecords.forEach(record => {
      sourceStats[record.source] = (sourceStats[record.source] || 0) + 1
    })

    // 生成月度签到日历（最近6个月）
    const monthlyCalendar: { [key: string]: number[] } = {}
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

      const monthSignIns = signInRecords.filter(record => {
        const recordDate = new Date(record.signInDate)
        return recordDate.getFullYear() === date.getFullYear() &&
               recordDate.getMonth() === date.getMonth()
      })

      monthlyCalendar[monthKey] = monthSignIns.map(record =>
        new Date(record.signInDate).getDate()
      ).sort((a, b) => a - b)
    }

    // 最近签到记录（最近10次）
    const recentRecords = signInRecords.slice(0, 10).map(record => ({
      date: record.signInDate,
      continuousDays: record.continuousDays,
      pointsEarned: record.pointsEarned,
      source: record.source
    }))

    const stats = {
      user_stats: {
        total_sign_ins: totalSignIns,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_points_from_signin: totalPointsFromSignIn,
        sign_in_rate: Math.round(signInRate * 100) / 100,
        favorite_time: favoriteTime,
        sources: sourceStats
      },
      monthly_calendar: monthlyCalendar,
      recent_records: recentRecords
    }

    return successResponse(res, stats)
  } catch (error) {
    console.error('获取签到统计失败:', error)
    return errorResponse(res, 'SERVER_ERROR', '获取签到统计失败', undefined, 500)
  }
}

export default handler
