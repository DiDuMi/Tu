import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 创建模板的验证模式
const createTemplateSchema = z.object({
  title: z.string().max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空'),
  type: z.enum(['HEADER', 'FOOTER', 'GENERAL']).default('GENERAL'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  tagIds: z.array(z.number()).optional(),
  sortOrder: z.number().default(0)
})

// 更新模板的验证模式
const updateTemplateSchema = createTemplateSchema.partial()

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  type: z.enum(['HEADER', 'FOOTER', 'GENERAL']).optional(),
  search: z.string().optional(),
  tagIds: z.string().optional(), // 逗号分隔的标签ID
  isPublic: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'useCount', 'sortOrder']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' }
    })
  }

  const userId = parseInt(session.user.id as string)

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, userId)
      case 'POST':
        return await handlePost(req, res, userId)
      default:
        return res.status(405).json({
          success: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' }
        })
    }
  } catch (error) {
    console.error('Content templates API error:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
    })
  }
}

// 获取模板列表
async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const query = querySchema.parse(req.query)

  const where: any = {
    deletedAt: null,
    OR: [
      { userId }, // 用户自己的模板
      { isPublic: true } // 公开模板
    ]
  }

  // 类型筛选
  if (query.type) {
    where.type = query.type
  }

  // 搜索筛选
  if (query.search) {
    where.OR = [
      ...where.OR,
      {
        title: { contains: query.search, mode: 'insensitive' }
      },
      {
        description: { contains: query.search, mode: 'insensitive' }
      }
    ]
  }

  // 标签筛选
  if (query.tagIds) {
    const tagIdArray = query.tagIds.split(',').map(Number).filter(Boolean)
    if (tagIdArray.length > 0) {
      where.templateTags = {
        some: {
          tagId: { in: tagIdArray }
        }
      }
    }
  }

  // 公开状态筛选
  if (query.isPublic !== undefined) {
    where.isPublic = query.isPublic
  }

  const skip = (query.page - 1) * query.limit

  const [templates, total] = await Promise.all([
    prisma.contentTemplate.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        },
        templateTags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit
    }),
    prisma.contentTemplate.count({ where })
  ])

  return res.status(200).json({
    success: true,
    data: {
      items: templates.map(template => ({
        ...template,
        tags: template.templateTags.map(tt => tt.tag),
        templateTags: undefined
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    }
  })
}

// 创建新模板
async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const data = createTemplateSchema.parse(req.body)

  const template = await prisma.contentTemplate.create({
    data: {
      title: data.title || `模板_${Date.now()}`,
      content: data.content,
      type: data.type,
      description: data.description,
      isPublic: data.isPublic,
      sortOrder: data.sortOrder,
      userId,
      templateTags: data.tagIds ? {
        create: data.tagIds.map(tagId => ({ tagId }))
      } : undefined
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      },
      templateTags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true }
          }
        }
      }
    }
  })

  return res.status(201).json({
    success: true,
    data: {
      ...template,
      tags: template.templateTags.map(tt => tt.tag),
      templateTags: undefined
    }
  })
}
