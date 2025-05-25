import { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { generateCategorySlug } from '@/lib/content'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  search: z.string().optional(),
  parentId: z.coerce.number().optional(),
})

// 创建分类验证模式
const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.number().optional().nullable(),
  order: z.number().default(0),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 请求 - 获取分类列表
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

      const { page, limit, search, parentId } = validationResult.data

      // 构建查询条件
      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ]
      }

      if (parentId !== undefined) {
        where.parentId = parentId === 0 ? null : parentId
      }

      // 设置缓存控制头
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');

      // 使用Prisma事务优化查询，减少数据库连接次数
      const [categories, total] = await prisma.$transaction([
        // 查询分类列表 - 不分页，直接返回所有分类
        prisma.category.findMany({
          where,
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            description: true,
            parentId: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            // 只选择必要的父分类字段
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            // 使用_count进行计数，避免加载完整关联数据
            _count: {
              select: {
                pages: true,
                children: true,
              },
            },
          },
          orderBy: [
            { order: 'asc' },
            { name: 'asc' },
          ],
          // 移除分页，直接返回所有分类（通常分类数量不会很多）
          // 如果需要分页，可以取消下面两行的注释
          // skip: (page - 1) * limit,
          // take: limit,
        }),

        // 查询总数
        prisma.category.count({ where })
      ])

      // 记录API返回的分类数据
      console.log('API返回分类数据:', {
        count: categories.length,
        firstItem: categories.length > 0 ? categories[0] : null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      })

      // 返回包含items字段的对象，保持与前端代码的一致性
      return successResponse(res, {
        items: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }, '获取分类列表成功')
    } catch (error) {
      console.error('获取分类列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取分类列表失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 创建分类
  else if (req.method === 'POST') {
    try {
      // 验证请求数据
      const validationResult = createCategorySchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, slug, description, parentId, order } = validationResult.data

      // 检查父分类是否存在
      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        })

        if (!parentCategory) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            '父分类不存在',
            undefined,
            422
          )
        }
      }

      // 检查分类名称是否已存在
      const existingCategory = await prisma.category.findFirst({
        where: { name },
      })

      if (existingCategory) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '分类名称已存在',
          undefined,
          422
        )
      }

      // 生成 slug
      const categorySlug = slug || generateCategorySlug(name)

      // 检查 slug 是否已存在
      const existingSlug = await prisma.category.findFirst({
        where: { slug: categorySlug },
      })

      if (existingSlug) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '分类别名已存在',
          undefined,
          422
        )
      }

      // 创建分类
      const category = await prisma.category.create({
        data: {
          name,
          slug: categorySlug,
          description,
          parentId,
          order,
        },
      })

      // 查询创建的分类（包含关联数据）
      const createdCategory = await prisma.category.findUnique({
        where: { id: category.id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              pages: true,
              children: true,
            },
          },
        },
      })

      return successResponse(res, createdCategory, '分类创建成功')
    } catch (error) {
      console.error('创建分类失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建分类失败',
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
export default withErrorHandler(withAuth(handler))
