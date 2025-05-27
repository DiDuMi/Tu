import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { extractTagsFromTitle, generateTagSlug, extractExcerpt, getContentPreviewInfoWithVideo } from '@/lib/content'
import { setPublishedContentCache, setNonPublishedContentCache } from '@/lib/cache-middleware'
import { hasHomepagePublishPermission } from '@/lib/homepage-permissions'

// 更新内容验证模式 - 支持部分更新
const updatePageSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  contentBlocks: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).optional(),
  categoryId: z.union([z.number(), z.string(), z.null()]).optional().transform(val => {
    if (val === null || val === undefined || val === '' || val === 'null') {
      return null
    }
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? null : num
  }),
  tagIds: z.array(z.number()).optional(),
  featured: z.boolean().optional(),
  scheduledPublishAt: z.string().optional().nullable(),
  scheduledArchiveAt: z.string().optional().nullable(),
  changeLog: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的内容ID',
      undefined,
      422
    )
  }

  // 查找内容 - 一次性查询所有需要的数据
  console.log(`查找内容，ID: ${id}`)
  let page

  try {
    // 构建查询条件 - 支持UUID和数字ID
    const whereCondition = !isNaN(parseInt(id, 10))
      ? { OR: [{ uuid: id }, { id: parseInt(id, 10) }] }
      : { uuid: id }

    // 一次性查询所有需要的数据，避免重复查询
    page = await prisma.page.findFirst({
      where: {
        ...whereCondition,
        deletedAt: null, // 使用复合索引
      },
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
                useCount: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            versions: true,
          },
        },
      },
    })
  } catch (error) {
    console.error(`查找内容失败: ${error}`)
  }

  if (!page) {
    return errorResponse(
      res,
      'NOT_FOUND',
      '内容不存在',
      undefined,
      404
    )
  }

  // GET 请求 - 获取内容详情
  if (req.method === 'GET') {
    try {
      // 检查访问权限
      // 如果内容未发布，只有作者或管理员/操作员可以访问
      // 注意：REVIEW状态（待审核）也允许作者访问
      console.log(`内容状态: ${page.status}, 用户ID: ${session?.user?.id}, 内容作者ID: ${page.userId}`)

      // 已发布内容允许所有人访问
      if (page.status === 'PUBLISHED') {
        // 允许访问，继续处理
      }
      // 非发布状态需要检查权限
      else if (!session) {
        // 未登录用户不能访问非发布内容
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权访问此内容',
          undefined,
          403
        )
      }
      // 检查是否为作者或管理员/操作员
      else if (parseInt(session.user.id, 10) !== page.userId &&
               session.user.role !== 'ADMIN' &&
               session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权访问此内容',
          undefined,
          403
        )
      }

      // 增加浏览次数（仅对已发布内容）- 异步执行，不阻塞响应
      if (page.status === 'PUBLISHED') {
        // 使用异步更新，不等待结果
        prisma.page.update({
          where: { id: page.id },
          data: { viewCount: { increment: 1 } },
        }).catch(error => {
          console.error('更新浏览次数失败:', error)
        })
      }

      console.log(`获取内容详情: ID=${page.id}, UUID=${page.uuid}, 状态=${page.status}`)

      // 获取用户组信息（如果用户已登录）
      let userGroup = null

      if (session?.user?.userGroupId) {
        try {
          userGroup = await prisma.userGroup.findUnique({
            where: { id: session.user.userGroupId },
            select: {
              id: true,
              name: true,
              previewPercentage: true,
              permissions: true,
            },
          })
        } catch (error) {
          console.error('获取用户组信息失败:', error)
        }
      } else if (session?.user?.id) {
        // 如果session中没有userGroupId，直接从数据库查询用户信息
        try {
          const user = await prisma.user.findUnique({
            where: { id: parseInt(session.user.id, 10) },
            select: {
              userGroupId: true,
              userGroup: {
                select: {
                  id: true,
                  name: true,
                  previewPercentage: true,
                  permissions: true,
                }
              }
            }
          })
          if (user?.userGroup) {
            userGroup = user.userGroup
          }
        } catch (error) {
          console.error('从数据库获取用户组信息失败:', error)
        }
      } else {
        // 未登录用户（游客）- 获取游客权限设置
        try {
          const guestPermissionsSetting = await prisma.systemSetting.findUnique({
            where: { key: 'guest_permissions' }
          })

          if (guestPermissionsSetting) {
            const guestPermissions = JSON.parse(guestPermissionsSetting.value)
            // 构造一个虚拟的用户组对象，包含游客权限设置
            userGroup = {
              id: 0,
              name: '游客',
              previewPercentage: guestPermissions.previewPercentage || 0,
              permissions: JSON.stringify({
                video: guestPermissions.canPlayVideo ? ['play'] : []
              })
            }
          } else {
            // 如果没有设置，使用默认游客权限
            const { GUEST_PERMISSIONS } = await import('@/lib/homepage-permissions')
            userGroup = {
              id: 0,
              name: '游客',
              previewPercentage: GUEST_PERMISSIONS.previewPercentage,
              permissions: JSON.stringify({
                video: GUEST_PERMISSIONS.canPlayVideo ? ['play'] : []
              })
            }
          }
        } catch (error) {
          console.error('获取游客权限设置失败:', error)
          // 使用默认游客权限作为后备
          const { GUEST_PERMISSIONS } = await import('@/lib/homepage-permissions')
          userGroup = {
            id: 0,
            name: '游客',
            previewPercentage: GUEST_PERMISSIONS.previewPercentage,
            permissions: JSON.stringify({
              video: GUEST_PERMISSIONS.canPlayVideo ? ['play'] : []
            })
          }
        }
      }

      // 处理标题，确保显示的是不包含标签的标题
      const { displayTitle } = extractTagsFromTitle(page.title)

      // 根据用户组权限处理内容预览
      let processedContent = page.content
      let previewInfo = null

      // 只对已发布的内容应用预览限制
      if (page.status === 'PUBLISHED') {
        // 如果用户是内容作者、管理员或操作员，显示完整内容
        const isAuthorOrAdmin = session && (
          parseInt(session.user.id, 10) === page.userId ||
          session.user.role === 'ADMIN' ||
          session.user.role === 'OPERATOR'
        )

        if (!isAuthorOrAdmin) {
          // 应用预览限制和视频权限控制
          const contentPreview = getContentPreviewInfoWithVideo(page.content, userGroup)

          processedContent = contentPreview.previewContent
          previewInfo = {
            previewPercentage: contentPreview.previewPercentage,
            hasFullAccess: contentPreview.hasFullAccess,
            hasVideoPermission: contentPreview.hasVideoPermission,
            isLimited: contentPreview.isLimited,
            hasVideoRestriction: contentPreview.hasVideoRestriction
          }
        } else {
          // 作者、管理员和操作员有完整访问权限，包括视频播放权限
          previewInfo = {
            previewPercentage: 100,
            hasFullAccess: true,
            hasVideoPermission: true,
            isLimited: false,
            hasVideoRestriction: false
          }
        }
      } else {
        // 对于非发布状态的内容，作者、管理员和操作员也有完整权限
        previewInfo = {
          previewPercentage: 100,
          hasFullAccess: true,
          hasVideoPermission: true,
          isLimited: false,
          hasVideoRestriction: false
        }
      }

      // 转换标签数据结构和作者信息 - 直接使用已查询的数据
      const formattedPage = {
        ...page,
        title: displayTitle, // 使用处理后的标题
        content: processedContent, // 使用处理后的内容
        tags: page.pageTags.map(pt => ({
          ...pt.tag,
          count: pt.tag.useCount || 0 // 添加数量字段
        })),
        pageTags: undefined,
        // 添加author字段，与前端保持一致
        author: page.user ? {
          id: page.user.id,
          name: page.user.name,
          avatar: page.user.image
        } : null,
        // 添加预览信息
        previewInfo
      }

      // 根据内容状态设置适当的缓存策略
      if (page.status === 'PUBLISHED') {
        // 对于已发布内容，使用较短的缓存时间以确保更新能及时生效
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=300')
      } else {
        setNonPublishedContentCache(res)
      }

      return successResponse(res, formattedPage)
    } catch (error) {
      console.error('获取内容详情失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取内容详情失败',
        undefined,
        500
      )
    }
  }

  // PUT 或 PATCH 请求 - 更新内容
  else if (req.method === 'PUT' || req.method === 'PATCH') {
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

      // 检查权限（只有作者或管理员/操作员可以更新内容）
      if (parseInt(session.user.id, 10) !== page.userId &&
          session.user.role !== 'ADMIN' &&
          session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权更新此内容',
          undefined,
          403
        )
      }

      // 验证请求数据
      const validationResult = updatePageSchema.safeParse(req.body)

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
        status,
        categoryId,
        tagIds,
        featured,
        scheduledPublishAt,
        scheduledArchiveAt,
        changeLog
      } = validationResult.data

      // 构建更新数据对象，只包含提供的字段
      const updateData: any = {}

      // 处理标题和标签提取
      let displayTitle = page.title
      let extractedTags: string[] = []

      if (title !== undefined) {
        const titleResult = extractTagsFromTitle(title)
        displayTitle = titleResult.displayTitle
        extractedTags = titleResult.tags
        updateData.title = displayTitle
      }

      // 处理其他字段
      if (content !== undefined) {
        updateData.content = content
        // 如果没有提供摘要但更新了内容，自动生成摘要
        if (excerpt === undefined) {
          updateData.excerpt = extractExcerpt(content)
        }
      }

      if (excerpt !== undefined) {
        updateData.excerpt = excerpt
      }

      if (contentBlocks !== undefined) {
        updateData.contentBlocks = contentBlocks
      }

      if (status !== undefined) {
        updateData.status = status
        // 处理发布时间
        if (status === 'PUBLISHED' && !page.publishedAt) {
          updateData.publishedAt = new Date()
        }
      }

      if (featured !== undefined) {
        updateData.featured = featured
      }

      if (categoryId !== undefined) {
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
        updateData.categoryId = categoryId
      }

      if (scheduledPublishAt !== undefined) {
        updateData.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null
      }

      if (scheduledArchiveAt !== undefined) {
        updateData.scheduledArchiveAt = scheduledArchiveAt ? new Date(scheduledArchiveAt) : null
      }

      // 更新内容
      const updatedPage = await prisma.page.update({
        where: { id: page.id },
        data: updateData,
      })

      // 创建新版本记录（只在有内容变化时）
      if (title !== undefined || content !== undefined || contentBlocks !== undefined) {
        // 获取当前版本号
        const latestVersion = await prisma.pageVersion.findFirst({
          where: { pageId: page.id },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        })

        const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1

        // 创建新版本记录
        await prisma.pageVersion.create({
          data: {
            pageId: page.id,
            userId: parseInt(session.user.id, 10),
            title: displayTitle,
            content: content || page.content,
            contentBlocks: contentBlocks || page.contentBlocks,
            versionNumber: newVersionNumber,
            changeLog: changeLog || `版本 ${newVersionNumber}`,
          },
        })
      }

      // 处理标签（只在标题或标签ID发生变化时处理）
      if (title !== undefined || tagIds !== undefined) {
        // 1. 删除现有标签关联
        const existingTags = await prisma.pageTag.findMany({
          where: { pageId: page.id },
          select: { tagId: true },
        })

        await prisma.pageTag.deleteMany({
          where: { pageId: page.id },
        })

        // 2. 减少原标签的使用次数
        if (existingTags.length > 0) {
          await prisma.$transaction(
            existingTags.map(({ tagId }) =>
              prisma.tag.update({
                where: { id: tagId },
                data: { useCount: { decrement: 1 } },
              })
            )
          )
        }

        // 3. 处理新标签
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
      }

      // 查询更新后的内容（包含关联数据）
      const fullUpdatedPage = await prisma.page.findUnique({
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
                  useCount: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              versions: true,
            },
          },
        },
      })

      // 转换标签数据结构和作者信息
      const formattedPage = {
        ...fullUpdatedPage,
        tags: fullUpdatedPage?.pageTags.map(pt => pt.tag) || [],
        pageTags: undefined,
        // 添加author字段，与前端保持一致
        author: fullUpdatedPage?.user ? {
          id: fullUpdatedPage.user.id,
          name: fullUpdatedPage.user.name,
          avatar: fullUpdatedPage.user.image
        } : null
      }

      // 设置缓存控制头，确保更新后的内容不被缓存
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')

      return successResponse(res, formattedPage, '内容更新成功')
    } catch (error) {
      console.error('更新内容失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新内容失败',
        undefined,
        500
      )
    }
  }

  // DELETE 请求 - 删除内容
  else if (req.method === 'DELETE') {
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

      // 检查权限（只有作者或管理员/操作员可以删除内容）
      if (parseInt(session.user.id, 10) !== page.userId &&
          session.user.role !== 'ADMIN' &&
          session.user.role !== 'OPERATOR') {
        return errorResponse(
          res,
          'FORBIDDEN',
          '无权删除此内容',
          undefined,
          403
        )
      }

      // 软删除内容
      await prisma.page.update({
        where: { id: page.id },
        data: { deletedAt: new Date() },
      })

      return successResponse(res, { uuid: page.uuid }, '内容删除成功')
    } catch (error) {
      console.error('删除内容失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '删除内容失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  else {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      `不支持的HTTP方法: ${req.method}。支持的方法: GET, PUT, PATCH, DELETE`,
      undefined,
      405
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
