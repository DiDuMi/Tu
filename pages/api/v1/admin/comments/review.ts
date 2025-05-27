import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAdmin } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { z } from 'zod'
import { awardCommentPoints } from '@/lib/commentRewards'

// 审核评论验证模式
const reviewCommentSchema = z.object({
  commentIds: z.array(z.number()).min(1, '至少选择一个评论'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: '操作类型必须是 approve 或 reject' }),
  }),
  reviewNote: z.string().max(500, '审核备注不能超过500个字符').optional(),
  qualityCommentIds: z.array(z.number()).optional(), // 优质评论ID列表
})

// 获取待审核评论验证模式
const getCommentsSchema = z.object({
  page: z.string().transform(val => parseInt(val)).default('1'),
  limit: z.string().transform(val => parseInt(val)).default('20'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // GET 请求 - 获取待审核评论列表
  if (req.method === 'GET') {
    try {
      const validationResult = getCommentsSchema.safeParse(req.query)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求参数验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { page, limit, status, search } = validationResult.data

      // 构建查询条件
      const where: any = {
        deletedAt: null,
        ...(status && { status }),
        ...(search && {
          OR: [
            { content: { contains: search } },
            { nickname: { contains: search } },
            { user: { name: { contains: search } } },
          ],
        }),
      }

      // 获取评论总数
      const total = await prisma.comment.count({ where })

      // 获取评论列表
      const comments = await prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          page: {
            select: {
              id: true,
              uuid: true,
              title: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      })

      // 格式化评论数据
      const formattedComments = comments.map(comment => ({
        ...comment,
        user: comment.user ? {
          ...comment.user,
          isAdmin: comment.user.role === 'ADMIN',
          role: undefined,
        } : null,
      }))

      return successResponse(res, {
        items: formattedComments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('获取评论列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取评论列表失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 审核评论
  if (req.method === 'POST') {
    try {
      const validationResult = reviewCommentSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { commentIds, action, reviewNote, qualityCommentIds = [] } = validationResult.data
      const reviewerId = parseInt(session.user.id)

      // 检查评论是否存在且状态为待审核
      const comments = await prisma.comment.findMany({
        where: {
          id: { in: commentIds },
          status: 'PENDING',
          deletedAt: null,
        },
        include: {
          user: true,
        },
      })

      if (comments.length !== commentIds.length) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '部分评论不存在或不是待审核状态',
          undefined,
          422
        )
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

      // 使用事务处理审核操作
      const result = await prisma.$transaction(async (tx) => {
        // 更新评论状态
        const updatedComments = await tx.comment.updateMany({
          where: {
            id: { in: commentIds },
          },
          data: {
            status: newStatus,
            reviewedAt: new Date(),
            reviewedBy: reviewerId,
            reviewNote: reviewNote || null,
          },
        })

        return { updatedComments }
      })

      // 如果是批准操作，为注册用户奖励积分
      if (action === 'approve') {
        const registeredUserComments = comments.filter(comment => comment.userId)
        
        if (registeredUserComments.length > 0) {
          // 异步处理积分奖励，不阻塞响应
          Promise.all(
            registeredUserComments.map(comment => 
              awardCommentPoints(
                comment.id, 
                qualityCommentIds.includes(comment.id)
              )
            )
          ).catch(error => {
            console.error('评论积分奖励失败:', error)
          })
        }
      }

      const actionText = action === 'approve' ? '批准' : '拒绝'
      return successResponse(
        res,
        {
          processedCount: result.updatedComments.count,
          action: actionText,
        },
        `成功${actionText} ${result.updatedComments.count} 条评论`
      )
    } catch (error) {
      console.error('审核评论失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '审核评论失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  return res.status(405).json({ 
    success: false, 
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } 
  })
}

export default withErrorHandler(withAdmin(handler))
