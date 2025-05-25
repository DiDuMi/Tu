import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { paginatedResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { formatMediaInfo } from '@/lib/media'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'CLOUD_VIDEO', 'ALL']).default('ALL'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'fileSize', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  tagIds: z.union([
    z.coerce.number().array(),
    z.coerce.number().transform(n => [n]),
    z.string().transform(s => s.split(',').map(Number).filter(n => !isNaN(n)))
  ]).optional(),
  userId: z.coerce.number().optional(),
  status: z.string().optional(),
})

/**
 * 媒体列表处理函数
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    // 验证查询参数
    const validation = querySchema.safeParse(req.query)
    if (!validation.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求参数验证失败',
        validation.error.format(),
        400
      )
    }

    const {
      page,
      limit,
      type,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      categoryId,
      tagIds,
      userId: queryUserId,
      status
    } = validation.data

    // 获取当前用户会话 - 媒体选择器允许未登录用户浏览
    const session = await getServerSession(req, res, authOptions)
    let user = null

    if (session && session.user) {
      // 获取用户ID
      user = await prisma.user.findUnique({
        where: { email: session.user.email as string },
        select: { id: true, role: true },
      })
    }

    // 构建查询条件
    const baseWhere: any = {
      deletedAt: null,
    }

    // 处理用户ID筛选
    if (queryUserId) {
      // 如果指定了用户ID，检查当前用户是否有权限查看该用户的媒体
      if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && queryUserId !== user.id)) {
        return errorResponse(
          res,
          'FORBIDDEN',
          '没有权限查看其他用户的媒体',
          undefined,
          403
        )
      }
      baseWhere.userId = queryUserId
    } else if (!user) {
      // 未登录用户只能查看公开媒体（状态为ACTIVE）
      baseWhere.status = 'ACTIVE'
    } else if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
      // 非管理员只能查看自己的媒体
      baseWhere.userId = user.id
    }

    // 按类型筛选
    if (type !== 'ALL') {
      baseWhere.type = type
    }

    // 按状态筛选
    if (status) {
      baseWhere.status = status
    }

    // 按分类筛选
    if (categoryId) {
      baseWhere.categoryId = categoryId
    }

    // 按标签筛选
    if (tagIds && tagIds.length > 0) {
      // 使用正确的关系名称 MediaToMediaTag
      baseWhere.mediaTags = {
        some: {
          tagId: {
            in: tagIds
          }
        }
      }
    }

    // 构建日期范围条件
    if (startDate || endDate) {
      baseWhere.createdAt = {}

      if (startDate) {
        baseWhere.createdAt.gte = new Date(startDate)
      }

      if (endDate) {
        baseWhere.createdAt.lte = new Date(endDate)
      }
    }

    // 构建最终查询条件
    const where = search
      ? {
          ...baseWhere,
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { mimeType: { contains: search } },
          ],
        }
      : baseWhere

    // 查询媒体列表
    const media = await prisma.media.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
          },
        },
        mediaTags: true,
        versions: {
          select: {
            thumbnailUrl: true,
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1, // 只获取最新版本
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // 格式化媒体数据
    const formattedMedia = media.map(formatMediaInfo)

    // 查询总数
    const total = await prisma.media.count({ where })

    // 返回分页响应
    return paginatedResponse(res, formattedMedia, total, page, limit)
  } catch (error) {
    console.error('获取媒体列表失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '获取媒体列表失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))
