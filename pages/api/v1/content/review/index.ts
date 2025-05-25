import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { paginatedResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  sortField: z.string().optional().default('createdAt'),
  sortDirection: z.string().optional().default('desc'),
})

const reviewActionSchema = z.object({
  contentId: z.number(),
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET和POST方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  // GET方法：获取待审核内容列表
  if (req.method === 'GET') {
    try {
      // 验证查询参数
      console.log('内容审核API查询参数:', req.query);
      const validationResult = querySchema.safeParse(req.query)

      if (!validationResult.success) {
        console.error('查询参数验证失败:', validationResult.error.format());
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '查询参数验证失败',
          validationResult.error.format(),
          422
        )
      }

      const {
        page,
        limit,
        search,
        categoryId,
        authorId,
        dateStart,
        dateEnd,
        sortField,
        sortDirection
      } = validationResult.data

      // 解析查询参数
      const parsedPage = typeof page === 'string' ? parseInt(page) || 1 : 1;
      const parsedLimit = typeof limit === 'string' ? parseInt(limit) || 10 : 10;
      const parsedCategoryId = categoryId && typeof categoryId === 'string' ? parseInt(categoryId) : undefined;
      const parsedAuthorId = authorId && typeof authorId === 'string' ? parseInt(authorId) : undefined;

      console.log('内容审核API解析后的查询参数:', {
        page: parsedPage,
        limit: parsedLimit,
        search,
        categoryId: parsedCategoryId,
        authorId: parsedAuthorId,
        dateStart,
        dateEnd,
        sortField,
        sortDirection
      });

      // 构建查询条件 - 只查询待审核状态的内容
      const where: any = {
        deletedAt: null,
        status: 'PENDING_REVIEW',
        ...(parsedCategoryId && { categoryId: parsedCategoryId }),
        ...(parsedAuthorId && { userId: parsedAuthorId }), // 注意：这里应该是userId而不是authorId
        ...(search && {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        }),
        ...(dateStart || dateEnd ? {
          createdAt: {
            ...(dateStart && { gte: new Date(dateStart) }),
            ...(dateEnd && { lte: new Date(`${dateEnd}T23:59:59Z`) }),
          }
        } : {}),
      }

      console.log('内容审核API查询条件:', where);

      // 查询总数
      const total = await prisma.page.count({ where })

      // 构建排序条件
      const orderBy: any = {}
      orderBy[sortField] = sortDirection

      // 查询内容列表
      const contents = await prisma.page.findMany({
        where,
        select: {
          id: true,
          uuid: true,
          title: true,
          excerpt: true,
          status: true,
          featured: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
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
                }
              }
            }
          },
        },
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
        orderBy,
      })

      console.log(`内容审核API查询结果: 找到 ${contents.length} 条记录`);

      // 格式化标签数据
      const formattedContents = contents.map(content => ({
        ...content,
        tags: content.pageTags?.map(t => t.tag) || [],
        author: content.user,
        user: undefined,
        pageTags: undefined
      }))

      // 返回分页响应
      console.log('内容审核API响应数据:', {
        items: formattedContents.length,
        total,
        page: parsedPage,
        limit: parsedLimit
      });
      return paginatedResponse(res, formattedContents, total, parsedPage, parsedLimit)
    } catch (error) {
      console.error('获取待审核内容列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取待审核内容列表失败',
        undefined,
        500
      )
    }
  }

  // POST方法：执行审核操作
  if (req.method === 'POST') {
    try {
      // 验证请求数据
      const validationResult = reviewActionSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { contentId, action, comment } = validationResult.data

      // 获取当前用户ID (从会话中)
      const reviewerId = 1 // 临时使用固定值，实际应从会话中获取

      // 检查内容是否存在且状态为待审核
      const content = await prisma.page.findFirst({
        where: {
          id: contentId,
          status: 'PENDING_REVIEW',
          deletedAt: null,
        },
      })

      if (!content) {
        return errorResponse(
          res,
          'CONTENT_NOT_FOUND',
          '内容不存在或不是待审核状态',
          undefined,
          404
        )
      }

      // 根据操作更新内容状态
      const newStatus = action === 'approve' ? 'PUBLISHED' : 'REJECTED'

      // 更新内容状态
      const updatedContent = await prisma.page.update({
        where: { id: contentId },
        data: {
          status: newStatus,
          ...(newStatus === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
          // TODO: 添加reviewerId和reviewedAt字段到Page模型
          // reviewerId,
          // reviewedAt: new Date(),
          // reviewComment: comment,
        },
        select: {
          id: true,
          uuid: true,
          title: true,
          status: true,
          // reviewedAt: true,
          publishedAt: true,
        },
      })

      // TODO: 创建ContentReview模型和审核记录
      // await prisma.contentReview.create({
      //   data: {
      //     pageId: contentId,
      //     reviewerId,
      //     action,
      //     comment: comment || '',
      //   },
      // })

      return res.status(200).json({
        success: true,
        data: updatedContent,
        message: action === 'approve' ? '内容已批准并发布' : '内容已拒绝',
      })
    } catch (error) {
      console.error('审核内容失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '审核内容失败',
        undefined,
        500
      )
    }
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
