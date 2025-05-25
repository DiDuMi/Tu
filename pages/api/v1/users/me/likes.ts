import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      '未授权操作',
      undefined,
      401
    )
  }

  // GET 请求 - 获取用户点赞列表
  if (req.method === 'GET') {
    try {
      // 获取分页参数
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      // 查询用户点赞总数
      const userId = parseInt(session.user.id, 10)
      if (isNaN(userId)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '无效的用户ID',
          undefined,
          400
        )
      }

      const total = await prisma.like.count({
        where: {
          userId,
        },
      })

      // 查询用户点赞列表
      const likes = await prisma.like.findMany({
        where: {
          userId,
        },
        include: {
          page: {
            select: {
              id: true,
              uuid: true,
              title: true,
              excerpt: true,
              status: true,
              viewCount: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              pageTags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
                take: 3, // 只获取前3个标签
              },
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      })

      // 格式化点赞数据
      const formattedLikes = likes.map(like => {
        const { page } = like
        return {
          id: page.id,
          uuid: page.uuid,
          title: page.title,
          excerpt: page.excerpt,
          viewCount: page.viewCount,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          likeId: like.id,
          likedAt: like.createdAt,
          author: page.user,
          category: page.category,
          tags: page.pageTags.map(pt => pt.tag),
          commentCount: page._count.comments,
          likeCount: page._count.likes,
        }
      })

      // 计算总页数
      const totalPages = Math.ceil(total / limit)

      // 返回成功响应
      return successResponse(res, formattedLikes, undefined, 200, {
        page,
        limit,
        total,
        totalPages,
      })
    } catch (error) {
      console.error('获取点赞列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取点赞列表失败',
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

export default withErrorHandler(handler)
