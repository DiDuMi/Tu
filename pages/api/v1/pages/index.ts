import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { extractTagsFromTitle, generateTagSlug, extractExcerpt } from '@/lib/content'
import { setDynamicContentCache, setNonPublishedContentCache } from '@/lib/cache-middleware'
import { hasHomepagePublishPermission } from '@/lib/homepage-permissions'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  status: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  tagId: z.coerce.number().optional(),
  tag: z.string().optional(), // 支持通过标签slug或uuid筛选
  search: z.string().optional(),
  keyword: z.string().optional(), // 支持keyword参数，与search等效
  q: z.string().optional(), // 支持q参数，与search等效
  category: z.string().optional(), // 支持通过分类slug筛选
  timeRange: z.string().optional(), // 时间范围筛选
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  sort: z.string().optional(),
  sortField: z.enum(['id', 'title', 'status', 'createdAt', 'updatedAt', 'publishedAt', 'viewCount']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})

// 创建内容验证模式
const createPageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
  contentBlocks: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).default('DRAFT'),
  categoryId: z.number().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
  featured: z.boolean().default(false),
  scheduledPublishAt: z.string().optional().nullable(),
  scheduledArchiveAt: z.string().optional().nullable(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  // GET 请求 - 获取内容列表
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

      const {
        page,
        limit,
        status,
        categoryId,
        tagId,
        tag,
        search,
        keyword,
        q,
        category,
        timeRange,
        dateStart,
        dateEnd,
        sort,
        sortField,
        sortDirection
      } = validationResult.data

      // 统一搜索关键词处理
      const searchKeyword = search || keyword || q

      // 构建查询条件
      const where: any = {
        deletedAt: null,
      }

      // 如果用户未登录或不是管理员/操作员，只显示已发布的内容
      if (!session || !(session.user.role === 'ADMIN' || session.user.role === 'OPERATOR')) {
        where.status = 'PUBLISHED'
      } else if (status) {
        // 如果是管理员/操作员且指定了状态，则按指定状态筛选
        where.status = status
      }

      // 分类筛选
      if (categoryId) {
        where.categoryId = categoryId
      } else if (category) {
        // 通过分类slug筛选
        where.category = { slug: category }
      }

      // 标签筛选 - 支持通过tagId或tag(slug/uuid)筛选
      if (tagId) {
        where.pageTags = {
          some: {
            tagId
          }
        }
      } else if (tag) {
        // 通过标签slug或uuid筛选
        where.pageTags = {
          some: {
            tag: {
              OR: [
                { slug: tag },
                { uuid: tag }
              ]
            }
          }
        }
      }

      // 搜索条件
      if (searchKeyword) {
        where.OR = [
          { title: { contains: searchKeyword } },
          { content: { contains: searchKeyword } },
        ]
      }

      // 日期范围筛选
      if (dateStart || dateEnd) {
        where.createdAt = {
          ...(dateStart && { gte: new Date(dateStart) }),
          ...(dateEnd && { lte: new Date(`${dateEnd}T23:59:59Z`) }),
        }
      } else if (timeRange) {
        // 预设时间范围筛选
        const now = new Date()
        let startDate: Date | undefined

        switch (timeRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
        }

        if (startDate) {
          where.createdAt = { gte: startDate }
        }
      }

      // 构建排序条件
      let orderBy: any = {}

      // 处理特殊排序
      if (sort) {
        switch (sort) {
          case 'newest':
            orderBy = { createdAt: 'desc' }
            break
          case 'oldest':
            orderBy = { createdAt: 'asc' }
            break
          case 'popular':
            orderBy = { viewCount: 'desc' }
            break
          case 'trending':
            orderBy = [
              { viewCount: 'desc' },
              { createdAt: 'desc' }
            ]
            break
          case 'most_liked':
            // 这里需要特殊处理，因为likes是关联表
            // 先按普通方式排序，后续可能需要单独查询
            orderBy = { createdAt: 'desc' }
            break
          case 'most_commented':
            // 这里需要特殊处理，因为comments是关联表
            // 先按普通方式排序，后续可能需要单独查询
            orderBy = { createdAt: 'desc' }
            break
          case 'featured':
            orderBy = [
              { featured: 'desc' },
              { createdAt: 'desc' }
            ]
            break
          case 'home_featured':
            // 首页精选内容 - 显示"精选内容"分类的内容，不足时显示featured内容
            where.OR = [
              {
                category: { slug: 'featured' }
              },
              { featured: true }
            ]
            orderBy = [
              { featured: 'desc' },
              { createdAt: 'desc' }
            ]
            break
          case 'home_latest':
            // 首页近期流出 - 显示"近期流出"分类的内容
            where.category = { slug: 'latest' }
            orderBy = { createdAt: 'desc' }
            break
          case 'home_archive':
            // 首页往期补档 - 显示"往期补档"分类的内容
            where.category = { slug: 'archive' }
            orderBy = [
              { viewCount: 'desc' },
              { createdAt: 'desc' }
            ]
            break
          case 'home_trending':
            // 首页热门推荐 - 显示"热门推荐"分类的内容
            where.category = { slug: 'trending' }
            orderBy = [
              { viewCount: 'desc' },
              { createdAt: 'desc' }
            ]
            break
          default:
            orderBy[sortField] = sortDirection
        }
      } else {
        orderBy[sortField] = sortDirection
      }

      // 使用Prisma事务优化查询，减少数据库连接次数
      const [pages, total] = await prisma.$transaction([
        // 查询内容列表
        prisma.page.findMany({
          where,
          select: {
            id: true,
            uuid: true,
            title: true,
            excerpt: true,
            coverImage: true,
            status: true,
            featured: true,
            publishedAt: true,
            scheduledPublishAt: true,
            scheduledArchiveAt: true,
            viewCount: true,
            likeCount: true,
            createdAt: true,
            updatedAt: true,
            // 只选择必要的用户字段
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            // 只选择必要的分类字段
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            // 只选择必要的标签字段
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
            },
            // 使用_count进行计数，避免加载完整关联数据
            _count: {
              select: {
                comments: true,
                likes: true,
                versions: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          // 添加缓存提示
          ...(process.env.NODE_ENV === 'production' ? { cacheStrategy: { ttl: 30 } } : {}),
        }),

        // 查询总数
        prisma.page.count({ where })
      ])

      // 转换标签数据结构和作者信息
      const formattedPages = pages.map((page: any) => {
        // 处理标题，确保显示的是不包含标签的标题
        const { displayTitle } = extractTagsFromTitle(page.title)

        return {
          ...page,
          title: displayTitle, // 使用处理后的标题
          tags: page.pageTags?.map((pt: any) => ({
            ...pt.tag,
            count: pt.tag.useCount || 0 // 添加数量字段
          })) || [],
          pageTags: undefined,
          // 添加计数字段，与前端保持一致
          commentCount: page._count?.comments || 0,
          likeCount: page._count?.likes || 0,
          // 添加author字段，与前端保持一致
          author: page.user ? {
            id: page.user.id,
            name: page.user.name,
            avatar: page.user.image
          } : null
        }
      })

      // 设置缓存策略
      // 如果是公开内容列表，使用动态内容缓存
      // 如果是管理员查看的内容列表，禁用缓存
      if (!session || !(session.user.role === 'ADMIN' || session.user.role === 'OPERATOR')) {
        setDynamicContentCache(res)
      } else {
        setNonPublishedContentCache(res)
      }

      return successResponse(res, {
        items: formattedPages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
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

  // POST 请求 - 创建内容
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

      // 验证请求数据
      const validationResult = createPageSchema.safeParse(req.body)

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
        contentBlocks,
        excerpt,
        coverImage,
        status,
        categoryId,
        tagIds,
        featured,
        scheduledPublishAt,
        scheduledArchiveAt
      } = validationResult.data

      // 从标题中提取标签
      const { displayTitle, originalTitle, tags: extractedTags } = extractTagsFromTitle(title)

      // 处理发布时间
      let publishedAt = null
      if (status === 'PUBLISHED') {
        publishedAt = new Date()
      }

      // 验证首页分类发布权限
      if (categoryId && session) {
        // 获取分类信息
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { slug: true, name: true }
        })

        if (category) {
          // 检查是否有权限发布到该首页分类
          if (!hasHomepagePublishPermission(session, category.slug)) {
            return errorResponse(
              res,
              'PERMISSION_DENIED',
              `您没有权限发布内容到"${category.name}"分类`,
              undefined,
              403
            )
          }
        }
      }

      // 创建内容
      console.log(`创建内容，状态: ${status}`)
      const page = await prisma.page.create({
        data: {
          title: originalTitle,
          content,
          contentBlocks,
          excerpt: excerpt || extractExcerpt(content),
          coverImage,
          status,
          featured,
          publishedAt,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          scheduledArchiveAt: scheduledArchiveAt ? new Date(scheduledArchiveAt) : null,
          userId: parseInt(session.user.id, 10),
          categoryId,
        },
      })

      // 处理标签
      const allTags = new Set<string>(extractedTags)
      const processedTagIds = new Set<number>()

      // 处理用户手动选择的标签
      if (tagIds && tagIds.length > 0) {
        // 创建已有标签的关联
        // 使用事务和单个创建来替代createMany，以兼容SQLite
        await prisma.$transaction(
          tagIds.map(tagId =>
            prisma.pageTag.upsert({
              where: {
                pageId_tagId: {
                  pageId: page.id,
                  tagId,
                }
              },
              update: {},
              create: {
                pageId: page.id,
                tagId,
              },
            })
          )
        )

        // 更新标签使用次数
        await prisma.$transaction(
          tagIds.map(tagId =>
            prisma.tag.update({
              where: { id: tagId },
              data: { useCount: { increment: 1 } },
            })
          )
        )

        // 记录已处理的标签ID
        tagIds.forEach(tagId => processedTagIds.add(tagId))
      }

      // 处理从标题提取的标签
      if (allTags.size > 0) {
        for (const tagName of allTags) {
          // 查找或创建标签
          const tag = await prisma.tag.upsert({
            where: { name: tagName },
            update: { useCount: { increment: 1 } },
            create: {
              name: tagName,
              slug: generateTagSlug(tagName),
              useCount: 1,
            },
          })

          // 只有当标签ID未被处理过时才创建关联
          if (!processedTagIds.has(tag.id)) {
            // 使用 upsert 避免重复创建
            await prisma.pageTag.upsert({
              where: {
                pageId_tagId: {
                  pageId: page.id,
                  tagId: tag.id,
                }
              },
              update: {},
              create: {
                pageId: page.id,
                tagId: tag.id,
              },
            })
            processedTagIds.add(tag.id)
          }
        }
      }

      // 创建第一个版本记录
      await prisma.pageVersion.create({
        data: {
          pageId: page.id,
          userId: parseInt(session.user.id, 10),
          title: originalTitle,
          content,
          contentBlocks,
          versionNumber: 1,
          changeLog: '初始版本',
        },
      })

      // 查询创建的内容（包含关联数据）
      const createdPage = await prisma.page.findUnique({
        where: { id: page.id },
        include: {
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
        },
      })

      console.log('创建的内容:', {
        id: createdPage?.id,
        uuid: createdPage?.uuid,
        title: createdPage?.title
      })

      // 转换标签数据结构和作者信息
      const formattedPage = {
        ...createdPage,
        tags: createdPage?.pageTags.map(pt => pt.tag) || [],
        pageTags: undefined,
        // 添加author字段，与前端保持一致
        author: createdPage?.user ? {
          id: createdPage.user.id,
          name: createdPage.user.name,
          avatar: createdPage.user.image
        } : null
      }

      return successResponse(res, formattedPage, '内容创建成功')
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

  // 不支持的方法
  else {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
