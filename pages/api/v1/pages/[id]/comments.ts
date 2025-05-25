import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { z } from 'zod'

// 创建评论验证模式
const createCommentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000个字符'),
  parentId: z.number().optional(),
  isAnonymous: z.boolean().optional().default(false),
  nickname: z.string().optional(),
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

      return successResponse(res, formattedComments)
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

      const { content, parentId, isAnonymous, nickname } = validationResult.data

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
      const comment = await prisma.comment.create({
        data: {
          content,
          pageId: page.id,
          userId: isAnonymous ? null : parseInt(session.user.id),
          parentId,
          isAnonymous,
          nickname: isAnonymous ? nickname : null,
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

      return successResponse(res, formattedComment, '评论发表成功')
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
