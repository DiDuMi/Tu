import { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { generateTagSlug } from '@/lib/content'
import { prisma } from '@/lib/prisma'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'useCount', 'createdAt']).default('useCount'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})

// 创建标签验证模式
const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过50个字符'),
  slug: z.string().optional(),
  description: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  // GET 请求 - 获取标签列表
  if (req.method === 'GET') {
    try {
      // 验证请求参数
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

      const { page, limit, search, sortBy, sortDirection } = validationResult.data

      // 构建查询条件
      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ]
      }

      // 构建排序条件
      // 注意：虽然Tag模型中有useCount字段，但Prisma不支持直接用它排序
      // 只使用Prisma支持的字段进行排序
      const orderBy: any = {}

      if (['name', 'createdAt', 'updatedAt'].includes(sortBy)) {
        orderBy[sortBy] = sortDirection
      } else {
        // 默认按名称排序
        orderBy.name = 'asc'
      }

      // 使用Prisma事务优化查询，减少数据库连接次数
      const [tags, total] = await prisma.$transaction([
        // 查询标签列表
        prisma.tag.findMany({
          where,
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            description: true,
            // useCount字段在select中是可以的，但不能用于orderBy
            useCount: true,
            createdAt: true,
            updatedAt: true,
            // 使用_count进行计数，避免加载完整关联数据
            _count: {
              select: {
                pageTags: true,
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          // 添加缓存提示
          ...(process.env.NODE_ENV === 'production' ? { cacheStrategy: { ttl: 60 } } : {}),
        }),

        // 查询总数
        prisma.tag.count({ where })
      ])

      return successResponse(res, {
        items: tags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('获取标签列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取标签列表失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 创建标签
  else if (req.method === 'POST') {
    try {
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

      // 检查权限（只有管理员/操作员可以手动创建标签）
      if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权创建标签',
          undefined,
          403
        )
      }

      // 验证请求数据
      const validationResult = createTagSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, slug, description } = validationResult.data

      // 检查标签名称是否已存在
      const existingTag = await prisma.tag.findFirst({
        where: { name },
      })

      if (existingTag) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '标签名称已存在',
          undefined,
          422
        )
      }

      // 生成 slug
      const tagSlug = slug || generateTagSlug(name)

      // 检查 slug 是否已存在
      const existingSlug = await prisma.tag.findFirst({
        where: { slug: tagSlug },
      })

      if (existingSlug) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '标签别名已存在',
          undefined,
          422
        )
      }

      // 创建标签
      const tag = await prisma.tag.create({
        data: {
          name,
          slug: tagSlug,
          description,
        },
      })

      return successResponse(res, tag, '标签创建成功')
    } catch (error) {
      console.error('创建标签失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建标签失败',
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
