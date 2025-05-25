import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { z } from 'zod'

// 添加收藏验证模式
const addFavoriteSchema = z.object({
  contentId: z.string().uuid('无效的内容ID'),
})

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

  // GET 请求 - 获取用户收藏列表
  if (req.method === 'GET') {
    try {
      // 获取分页参数
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      // 查询用户收藏总数
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

      const total = await prisma.favorite.count({
        where: {
          userId,
        },
      })

      // 查询用户收藏列表
      const favorites = await prisma.favorite.findMany({
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

      // 格式化收藏数据
      const formattedFavorites = favorites.map(favorite => {
        const { page } = favorite
        return {
          id: page.id,
          uuid: page.uuid,
          title: page.title,
          excerpt: page.excerpt,
          viewCount: page.viewCount,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          favoriteId: favorite.id,
          favoritedAt: favorite.createdAt,
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
      return successResponse(res, formattedFavorites, undefined, 200, {
        page,
        limit,
        total,
        totalPages,
      })
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取收藏列表失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 添加收藏
  else if (req.method === 'POST') {
    try {
      // 验证请求数据
      const validationResult = addFavoriteSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { contentId } = validationResult.data

      // 查找内容
      const page = await prisma.page.findUnique({
        where: { uuid: contentId },
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

      // 检查是否已收藏
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

      const existingFavorite = await prisma.favorite.findFirst({
        where: {
          userId,
          pageId: page.id,
        },
      })

      if (existingFavorite) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '已经收藏过该内容',
          undefined,
          422
        )
      }

      // 创建收藏
      const favorite = await prisma.favorite.create({
        data: {
          userId,
          pageId: page.id,
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
      })

      // 格式化收藏数据
      const formattedFavorite = {
        id: favorite.page.id,
        uuid: favorite.page.uuid,
        title: favorite.page.title,
        excerpt: favorite.page.excerpt,
        viewCount: favorite.page.viewCount,
        createdAt: favorite.page.createdAt,
        updatedAt: favorite.page.updatedAt,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt,
        author: favorite.page.user,
        category: favorite.page.category,
        tags: favorite.page.pageTags.map(pt => pt.tag),
        commentCount: favorite.page._count.comments,
        likeCount: favorite.page._count.likes,
      }

      // 返回成功响应
      return successResponse(res, formattedFavorite, '收藏成功')
    } catch (error) {
      console.error('添加收藏失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '添加收藏失败',
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
