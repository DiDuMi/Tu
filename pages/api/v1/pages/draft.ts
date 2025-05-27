import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { extractTagsFromTitle, generateTagSlug, extractExcerpt } from '@/lib/content'

// 草稿保存验证模式
const draftSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
  contentBlocks: z.string().optional(),
  excerpt: z.string().optional(),
  categoryId: z.number().optional().nullable(),
  tagIds: z.array(z.number()).optional(),
  coverImage: z.string().optional().nullable(),
  status: z.literal('DRAFT').default('DRAFT'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // GET 请求 - 获取用户的草稿
  if (req.method === 'GET') {
    try {
      const userId = parseInt(session.user.id, 10)

      // 查找用户最新的草稿
      const draft = await prisma.page.findFirst({
        where: {
          userId,
          status: 'DRAFT',
          deletedAt: null,
        },
        include: {
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
        orderBy: {
          updatedAt: 'desc'
        }
      })

      if (!draft) {
        return successResponse(res, null, '没有找到草稿')
      }

      // 转换数据格式
      const formattedDraft = {
        id: draft.id,
        uuid: draft.uuid,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        coverImage: draft.coverImage,
        categoryId: draft.categoryId,
        category: draft.category,
        tags: draft.pageTags.map(pt => pt.tag),
        tagIds: draft.pageTags.map(pt => pt.tag.id),
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      }

      console.log('获取草稿成功:', {
        id: draft.id,
        uuid: draft.uuid,
        title: draft.title,
        updatedAt: draft.updatedAt
      })

      return successResponse(res, formattedDraft, '获取草稿成功')
    } catch (error) {
      console.error('获取草稿失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取草稿失败',
        undefined,
        500
      )
    }
  }

  // POST 请求 - 保存草稿
  else if (req.method === 'POST') {
    try {
    // 验证请求数据
    const validationResult = draftSchema.safeParse(req.body)

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
      categoryId,
      tagIds,
      coverImage
    } = validationResult.data

    const userId = parseInt(session.user.id, 10)

    // 从标题中提取标签
    const { displayTitle, originalTitle, tags: extractedTags } = extractTagsFromTitle(title)

    // 检查是否已存在该用户的草稿
    const existingDraft = await prisma.page.findFirst({
      where: {
        userId,
        status: 'DRAFT',
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    let page

    if (existingDraft) {
      // 更新现有草稿
      console.log(`更新现有草稿，ID: ${existingDraft.id}`)
      page = await prisma.page.update({
        where: { id: existingDraft.id },
        data: {
          title: originalTitle,
          content,
          contentBlocks,
          excerpt: excerpt || extractExcerpt(content),
          coverImage,
          categoryId,
          updatedAt: new Date(),
        },
      })

      // 删除现有标签关联
      await prisma.pageTag.deleteMany({
        where: { pageId: page.id },
      })
    } else {
      // 创建新草稿
      console.log(`创建新草稿，用户ID: ${userId}, 分类ID: ${categoryId}`)

      // 验证用户是否存在且未被删除
      const userExists = await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
        select: { id: true, status: true }
      })

      if (!userExists) {
        console.error(`用户不存在: ${userId}`)
        console.error(`Session用户ID: ${userId}, Session邮箱: ${session.user.email}`)

        // 尝试通过邮箱查找用户
        const userByEmail = await prisma.user.findUnique({
          where: {
            email: session.user.email!,
            deletedAt: null
          },
          select: { id: true, status: true }
        })

        if (userByEmail) {
          console.log(`通过邮箱找到用户，实际ID: ${userByEmail.id}`)
          return errorResponse(
            res,
            'SESSION_USER_MISMATCH',
            '用户会话信息不匹配，请重新登录',
            { actualUserId: userByEmail.id, sessionUserId: userId },
            401
          )
        }

        return errorResponse(
          res,
          'USER_NOT_FOUND',
          '用户不存在，请重新登录',
          undefined,
          404
        )
      }

      page = await prisma.page.create({
        data: {
          title: originalTitle,
          content,
          contentBlocks,
          excerpt: excerpt || extractExcerpt(content),
          coverImage,
          status: 'DRAFT',
          userId,
          categoryId,
        },
      })

      // 创建第一个版本记录
      await prisma.pageVersion.create({
        data: {
          pageId: page.id,
          userId,
          title: originalTitle,
          content,
          contentBlocks,
          versionNumber: 1,
          changeLog: '草稿自动保存',
        },
      })
    }

    // 处理标签
    const allTags = new Set<string>(extractedTags)
    const processedTagIds = new Set<number>()

    // 处理用户手动选择的标签
    if (tagIds && tagIds.length > 0) {
      // 创建已有标签的关联
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
          // 创建关联
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

    console.log('草稿保存成功:', {
      id: page.id,
      uuid: page.uuid,
      title: page.title,
      isUpdate: !!existingDraft
    })

    return successResponse(res, {
      id: page.id,
      uuid: page.uuid,
      title: displayTitle,
      status: page.status,
      updatedAt: page.updatedAt,
      isUpdate: !!existingDraft
    }, existingDraft ? '草稿更新成功' : '草稿创建成功')

    } catch (error) {
      console.error('草稿保存失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '草稿保存失败',
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
      '方法不允许',
      undefined,
      405
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
