import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 获取用户个人统计数据
 * GET /api/v1/users/me/stats
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

      // 并行查询所有统计数据以提高性能
      const [
        contentCount,
        commentCount,
        likeCount,
        viewCountResult
      ] = await Promise.all([
        // 用户发布的内容数量
        prisma.page.count({
          where: {
            userId: user.id,
            deletedAt: null
          }
        }),

        // 用户的评论数量
        prisma.comment.count({
          where: {
            userId: user.id,
            deletedAt: null
          }
        }),

        // 用户获得的点赞数量（用户内容被点赞的总数）
        prisma.like.count({
          where: {
            page: {
              userId: user.id,
              deletedAt: null
            }
          }
        }),

        // 用户内容的总浏览量
        prisma.page.aggregate({
          where: {
            userId: user.id,
            deletedAt: null
          },
          _sum: {
            viewCount: true
          }
        })
      ])

      const viewCount = viewCountResult._sum.viewCount || 0

      return successResponse(res, {
        contentCount,
        commentCount,
        likeCount,
        viewCount
      })
    } catch (error) {
      console.error('获取用户统计数据失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户统计数据失败',
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
