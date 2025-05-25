import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { extractTagsFromTitle } from '@/lib/content'
import { z } from 'zod'

// 请求验证模式
const querySchema = z.object({
  excludeId: z.string().optional(),
  categoryId: z.string().optional(),
  tagId: z.string().optional(),
  limit: z.string().transform(Number).default('4'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 请求 - 获取相关内容
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

      const { excludeId, categoryId, tagId, limit } = validationResult.data

      // 构建查询条件 - 使用复合索引优化
      const where: any = {
        status: 'PUBLISHED',
        deletedAt: null,
      }

      // 排除指定内容
      if (excludeId) {
        // 使用数字ID而不是UUID进行排除，性能更好
        const excludeNumericId = parseInt(excludeId, 10)
        if (!isNaN(excludeNumericId)) {
          where.id = { not: excludeNumericId }
        } else {
          where.uuid = { not: excludeId }
        }
      }

      // 按分类筛选
      if (categoryId) {
        where.categoryId = parseInt(categoryId, 10)
      }

      // 按标签筛选
      if (tagId) {
        where.pageTags = {
          some: {
            tagId: parseInt(tagId, 10),
          },
        }
      }

      // 查询相关内容
      const relatedContents = await prisma.page.findMany({
        where,
        select: {
          id: true,
          uuid: true,
          title: true,
          excerpt: true,
          viewCount: true,
          createdAt: true,
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
                  useCount: true,
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
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      })

      // 转换标签数据结构
      const formattedContents = relatedContents.map(content => {
        // 处理标题，确保显示的是不包含标签的标题
        const { displayTitle } = extractTagsFromTitle(content.title)

        return {
          ...content,
          title: displayTitle, // 使用处理后的标题
          tags: content.pageTags.map(pt => ({
            ...pt.tag,
            count: pt.tag.useCount || 0 // 添加数量字段
          })),
          pageTags: undefined,
          author: content.user,
          user: undefined,
          commentCount: content._count.comments,
          likeCount: content._count.likes,
          _count: undefined,
        }
      })

      return successResponse(res, formattedContents)
    } catch (error) {
      console.error('获取相关内容失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取相关内容失败',
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
