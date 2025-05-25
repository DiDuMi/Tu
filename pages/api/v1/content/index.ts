import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { paginatedResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { processContentTags } from '@/lib/tag-extractor'

// 请求验证模式
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  status: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.string().optional(), // 逗号分隔的标签ID
  search: z.string().optional(),
  authorId: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  sortField: z.string().optional().default('createdAt'),
  sortDirection: z.string().optional().default('desc'),
})

const createContentSchema = z.object({
  title: z.string().min(2, '标题至少需要2个字符').max(200, '标题不能超过200个字符'),
  content: z.string().optional(),
  excerpt: z.string().max(500, '摘要不能超过500个字符').optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).default('DRAFT'),
  categoryId: z.number().optional(),
  tagIds: z.array(z.number()).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().optional(),
  scheduledPublishAt: z.string().optional(),
  scheduledArchiveAt: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET和POST方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  // GET方法：获取内容列表
  if (req.method === 'GET') {
    try {
      // 验证查询参数
      console.log('内容管理API查询参数:', req.query);
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
        status,
        categoryId,
        tagIds,
        search,
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
      const parsedTagIds = tagIds && typeof tagIds === 'string' ? tagIds.split(',').map(id => parseInt(id)) : [];

      console.log('内容管理API解析后的查询参数:', {
        page: parsedPage,
        limit: parsedLimit,
        status,
        categoryId: parsedCategoryId,
        authorId: parsedAuthorId,
        tagIds: parsedTagIds,
        search,
        dateStart,
        dateEnd,
        sortField,
        sortDirection
      });

      // 构建查询条件
      const where: any = {
        deletedAt: null,
        ...(status && { status }),
        ...(parsedCategoryId && { categoryId: parsedCategoryId }),
        ...(parsedAuthorId && { userId: parsedAuthorId }),
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

      console.log('内容管理API查询条件:', where);

      // 如果有标签过滤，添加标签关联条件
      if (parsedTagIds.length > 0) {
        where.pageTags = {
          some: {
            tagId: {
              in: parsedTagIds
            }
          }
        }
      }

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
          }
        },
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
        orderBy,
      })

      console.log(`内容管理API查询结果: 找到 ${contents.length} 条记录`);

      // 格式化标签数据
      const formattedContents = contents.map(content => ({
        ...content,
        tags: content.pageTags?.map(t => t.tag) || [],
        author: content.user,
        user: undefined,
        pageTags: undefined
      }))

      // 返回分页响应
      console.log('内容管理API响应数据:', {
        items: formattedContents.length,
        total,
        page: parsedPage,
        limit: parsedLimit
      });
      return paginatedResponse(res, formattedContents, total, parsedPage, parsedLimit)
    } catch (error) {
      console.error('获取内容列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取内容列表失败',
        undefined,
        500
      )
    }
  }

  // POST方法：创建内容
  if (req.method === 'POST') {
    try {
      // 验证请求数据
      const validationResult = createContentSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const {
        title,
        content,
        excerpt,
        status,
        categoryId,
        tagIds,
        featured,
        publishedAt,
        scheduledPublishAt,
        scheduledArchiveAt
      } = validationResult.data

      // 获取当前用户ID (从会话中)
      const userId = 1 // 临时使用固定值，实际应从会话中获取

      // 创建内容
      const newContent = await prisma.page.create({
        data: {
          title,
          content: content || '',
          excerpt,
          status,
          userId,
          featured: featured || false,
          ...(categoryId && { categoryId }),
          ...(publishedAt && { publishedAt: new Date(publishedAt) }),
          ...(scheduledPublishAt && { scheduledPublishAt: new Date(scheduledPublishAt) }),
          ...(scheduledArchiveAt && { scheduledArchiveAt: new Date(scheduledArchiveAt) }),
          deletedAt: null, // 明确设置deletedAt为null
        },
        select: {
          id: true,
          uuid: true,
          title: true,
          status: true,
          createdAt: true,
        },
      })

      // 处理内容标签（包括从标题和内容中提取的标签）
      const processedTagIds = await processContentTags(
        title,
        content || '',
        tagIds || []
      );

      // 如果有标签，创建标签关联
      if (processedTagIds.length > 0) {
        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
          // 创建标签关联数据
          const tagData = processedTagIds.map(tagId => ({
            pageId: newContent.id,
            tagId,
          }));

          // 由于SQLite不支持skipDuplicates选项，我们需要逐个创建并处理可能的错误
          for (const data of tagData) {
            try {
              await tx.pageTag.create({
                data,
              });
            } catch (error) {
              // 如果是唯一约束错误，则忽略
              if (!(error instanceof Error && error.message.includes('Unique constraint'))) {
                throw error;
              }
            }
          }
        });
      }

      return res.status(201).json({
        success: true,
        data: newContent,
        message: '内容创建成功',
      })
    } catch (error) {
      console.error('创建内容失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建内容失败',
        undefined,
        500
      )
    }
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
