import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求参数验证
const querySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  status: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取会话信息
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

  // GET 请求 - 获取当前用户的内容列表
  if (req.method === 'GET') {
    try {
      // 验证查询参数
      const validationResult = querySchema.safeParse(req.query)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求参数验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { page, limit, status, search, sort, order } = validationResult.data

      // 构建查询条件
      const where: any = {
        userId: parseInt(session.user.id, 10),
        deletedAt: null,
      }

      // 添加状态筛选
      if (status) {
        where.status = status
      }

      // 添加搜索条件
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ]
      }

      // 构建排序条件
      const orderBy: any = {}
      if (sort) {
        orderBy[sort] = order
      } else {
        orderBy.updatedAt = 'desc'
      }

      // 查询总数
      const totalItems = await prisma.page.count({ where })
      const totalPages = Math.ceil(totalItems / limit)

      // 查询内容列表
      const items = await prisma.page.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      })

      // 格式化响应数据
      const formattedItems = items.map(item => ({
        id: item.id,
        uuid: item.uuid,
        title: item.title,
        excerpt: item.excerpt,
        status: item.status,
        featured: item.featured,
        viewCount: item.viewCount,
        likeCount: item._count.likes,
        commentCount: item._count.comments,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        category: item.category,
      }))

      return successResponse(res, {
        items: formattedItems,
        page,
        limit,
        totalItems,
        totalPages,
      })
    } catch (error) {
      console.error('获取用户内容列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户内容列表失败',
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
