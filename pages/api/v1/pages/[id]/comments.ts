import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { z } from 'zod'
import { getOrCreateGuestId, filterVisibleComments } from '@/lib/guestIdentity'

// 创建评论验证模式
const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符'),
  parentId: z.number().optional(),
  isAnonymous: z.boolean().optional().default(false),
  nickname: z.string().optional(),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  guestId: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // 查找内容 - 使用复合索引优化
  const page = await prisma.page.findFirst({
    where: {
      uuid: id,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
    },
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

  // 只允许对已发布的内容进行评论
  if (page.status !== 'PUBLISHED') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '只能对已发布的内容进行评论',
      undefined,
      422
    )
  }

  // GET 请求 - 获取评论列表
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)
      const userId = session?.user?.id ? parseInt(session.user.id) : null
      const isAdmin = session?.user?.role === 'ADMIN'

      // 获取游客ID（从请求头或查询参数）
      const guestId = req.headers['x-guest-id'] as string || req.query.guestId as string

      const comments = await prisma.comment.findMany({
        where: {
          pageId: page.id,
          parentId: null, // 只获取顶级评论
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
          replies: {
            where: {
              deletedAt: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // 处理评论数据，添加isAdmin标志
      const formattedComments = comments.map(comment => ({
        ...comment,
        user: comment.user ? {
          ...comment.user,
          isAdmin: comment.user.role === 'ADMIN',
          role: undefined,
        } : null,
        replies: comment.replies.map(reply => ({
          ...reply,
          user: reply.user ? {
            ...reply.user,
            isAdmin: reply.user.role === 'ADMIN',
            role: undefined,
          } : null,
        })),
      }))

      // 过滤评论，只返回对当前用户可见的评论
      const visibleComments = filterVisibleComments(formattedComments, userId, guestId, isAdmin)

      return successResponse(res, visibleComments)
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

  // POST 请求 - 创建评论
  else if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)

    // 检查用户是否已登录（匿名评论除外）
    if (!req.body.isAnonymous && !session) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        '未授权操作',
        undefined,
        401
      )
    }

    try {
      // 验证请求数据
      const validationResult = createCommentSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { content, parentId, isAnonymous, nickname, email, guestId } = validationResult.data

      // 如果是匿名评论，检查昵称
      if (isAnonymous && !nickname) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '匿名评论需要提供昵称',
          undefined,
          422
        )
      }

      // 获取或生成游客ID
      let finalGuestId = guestId
      if (!session && !finalGuestId) {
        // 如果没有提供游客ID，生成一个临时ID
        finalGuestId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // 如果有parentId，检查父评论是否存在
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment || parentComment.pageId !== page.id) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            '父评论不存在',
            undefined,
            422
          )
        }
      }

      // 创建评论
      const commentData: any = {
        content,
        pageId: page.id,
        isAnonymous: isAnonymous || !session,
        status: 'PENDING', // 默认为待审核状态
      }

      // 只在有值时添加字段
      if (session && !isAnonymous) {
        commentData.userId = parseInt(session.user.id)
      }

      if (parentId) {
        commentData.parentId = parentId
      }

      if (isAnonymous || !session) {
        if (nickname) commentData.nickname = nickname
        if (email) commentData.email = email
        if (finalGuestId) commentData.guestId = finalGuestId
      }

      const comment = await prisma.comment.create({
        data: commentData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
      })

      // 格式化评论数据
      const formattedComment = {
        ...comment,
        user: comment.user ? {
          ...comment.user,
          isAdmin: comment.user.role === 'ADMIN',
          role: undefined,
        } : null,
      }

      // 返回评论数据，包含游客ID（如果适用）
      const responseData = {
        ...formattedComment,
        guestId: !session ? finalGuestId : undefined,
      }

      return successResponse(res, responseData, '评论发表成功，等待审核')
    } catch (error) {
      console.error('创建评论失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建评论失败',
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

// 使用中间件包装处理程序
export default withErrorHandler(handler)
