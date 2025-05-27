/**
 * 评论积分奖励工具
 * 用于处理评论通过审核后的积分奖励
 */

import { prisma } from '@/lib/prisma'

/**
 * 评论积分奖励配置
 */
export const COMMENT_REWARD_CONFIG = {
  // 基础评论奖励积分
  BASE_COMMENT_POINTS: 3,
  
  // 优质评论额外奖励（由管理员标记）
  QUALITY_COMMENT_BONUS: 5,
  
  // 每日评论奖励上限
  DAILY_COMMENT_LIMIT: 10,
  
  // 每日最大奖励积分
  DAILY_MAX_POINTS: 30,
}

/**
 * 为通过审核的评论奖励积分
 * @param commentId 评论ID
 * @param isQualityComment 是否为优质评论
 * @returns 奖励结果
 */
export async function awardCommentPoints(
  commentId: number,
  isQualityComment: boolean = false
): Promise<{
  success: boolean
  pointsAwarded: number
  message: string
}> {
  try {
    // 获取评论信息
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
        page: true,
      },
    })

    if (!comment) {
      return {
        success: false,
        pointsAwarded: 0,
        message: '评论不存在',
      }
    }

    // 只有注册用户才能获得积分奖励
    if (!comment.userId) {
      return {
        success: false,
        pointsAwarded: 0,
        message: '游客评论不奖励积分',
      }
    }

    // 检查是否已经奖励过积分
    if (comment.pointsAwarded) {
      return {
        success: false,
        pointsAwarded: 0,
        message: '该评论已经奖励过积分',
      }
    }

    // 检查评论状态
    if (comment.status !== 'APPROVED') {
      return {
        success: false,
        pointsAwarded: 0,
        message: '只有通过审核的评论才能获得积分奖励',
      }
    }

    // 检查今日评论奖励次数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCommentRewards = await prisma.pointTransaction.count({
      where: {
        userPoint: {
          userId: comment.userId,
        },
        type: 'COMMENT',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (todayCommentRewards >= COMMENT_REWARD_CONFIG.DAILY_COMMENT_LIMIT) {
      return {
        success: false,
        pointsAwarded: 0,
        message: '今日评论奖励次数已达上限',
      }
    }

    // 计算奖励积分
    let pointsToAward = COMMENT_REWARD_CONFIG.BASE_COMMENT_POINTS
    if (isQualityComment) {
      pointsToAward += COMMENT_REWARD_CONFIG.QUALITY_COMMENT_BONUS
    }

    // 检查今日奖励积分是否超过上限
    const todayPointsAwarded = await prisma.pointTransaction.aggregate({
      where: {
        userPoint: {
          userId: comment.userId,
        },
        type: 'COMMENT',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const currentTodayPoints = todayPointsAwarded._sum.amount || 0
    if (currentTodayPoints + pointsToAward > COMMENT_REWARD_CONFIG.DAILY_MAX_POINTS) {
      pointsToAward = Math.max(0, COMMENT_REWARD_CONFIG.DAILY_MAX_POINTS - currentTodayPoints)
      
      if (pointsToAward === 0) {
        return {
          success: false,
          pointsAwarded: 0,
          message: '今日评论积分奖励已达上限',
        }
      }
    }

    // 使用事务处理积分奖励
    const result = await prisma.$transaction(async (tx) => {
      // 更新评论的积分奖励状态
      await tx.comment.update({
        where: { id: commentId },
        data: { pointsAwarded: true },
      })

      // 更新用户积分
      const userPoint = await tx.userPoint.upsert({
        where: { userId: comment.userId! },
        update: {
          balance: { increment: pointsToAward },
          totalEarned: { increment: pointsToAward },
        },
        create: {
          userId: comment.userId!,
          balance: pointsToAward,
          totalEarned: pointsToAward,
          totalSpent: 0,
        },
      })

      // 创建积分交易记录
      await tx.pointTransaction.create({
        data: {
          userPointId: userPoint.id,
          amount: pointsToAward,
          type: 'COMMENT',
          description: `评论奖励${isQualityComment ? '（优质评论）' : ''}`,
          metadata: JSON.stringify({
            commentId: comment.id,
            pageId: comment.pageId,
            pageTitle: comment.page?.title || '',
            isQualityComment,
          }),
        },
      })

      return { userPoint, pointsToAward }
    })

    return {
      success: true,
      pointsAwarded: pointsToAward,
      message: `成功奖励 ${pointsToAward} 积分`,
    }
  } catch (error) {
    console.error('评论积分奖励失败:', error)
    return {
      success: false,
      pointsAwarded: 0,
      message: '积分奖励失败',
    }
  }
}

/**
 * 批量为评论奖励积分
 * @param commentIds 评论ID列表
 * @param qualityCommentIds 优质评论ID列表
 * @returns 批量奖励结果
 */
export async function batchAwardCommentPoints(
  commentIds: number[],
  qualityCommentIds: number[] = []
): Promise<{
  success: boolean
  totalPointsAwarded: number
  successCount: number
  failureCount: number
  details: Array<{
    commentId: number
    success: boolean
    pointsAwarded: number
    message: string
  }>
}> {
  const results = []
  let totalPointsAwarded = 0
  let successCount = 0
  let failureCount = 0

  for (const commentId of commentIds) {
    const isQualityComment = qualityCommentIds.includes(commentId)
    const result = await awardCommentPoints(commentId, isQualityComment)
    
    results.push({
      commentId,
      ...result,
    })

    if (result.success) {
      totalPointsAwarded += result.pointsAwarded
      successCount++
    } else {
      failureCount++
    }
  }

  return {
    success: successCount > 0,
    totalPointsAwarded,
    successCount,
    failureCount,
    details: results,
  }
}

/**
 * 获取用户今日评论奖励统计
 * @param userId 用户ID
 * @returns 今日奖励统计
 */
export async function getTodayCommentRewardStats(userId: number): Promise<{
  rewardCount: number
  totalPoints: number
  remainingRewards: number
  remainingPoints: number
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayRewards = await prisma.pointTransaction.findMany({
    where: {
      userPoint: {
        userId,
      },
      type: 'COMMENT',
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      amount: true,
    },
  })

  const rewardCount = todayRewards.length
  const totalPoints = todayRewards.reduce((sum, reward) => sum + reward.amount, 0)

  return {
    rewardCount,
    totalPoints,
    remainingRewards: Math.max(0, COMMENT_REWARD_CONFIG.DAILY_COMMENT_LIMIT - rewardCount),
    remainingPoints: Math.max(0, COMMENT_REWARD_CONFIG.DAILY_MAX_POINTS - totalPoints),
  }
}
