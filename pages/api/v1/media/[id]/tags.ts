import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'

// 请求验证模式
const updateTagsSchema = z.object({
  tagIds: z.array(z.number()),
})

/**
 * 媒体标签关联API
 * 支持获取、更新和删除媒体的标签关联
 */
export default withErrorHandler(
  withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
    // 获取媒体ID
    const { id } = req.query
    if (!id) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少媒体ID',
        undefined,
        400
      )
    }

    // 查询媒体
    const media = await prisma.media.findUnique({
      where: { id: parseInt(id as string) },
    })

    if (!media || media.deletedAt) {
      return errorResponse(
        res,
        'MEDIA_NOT_FOUND',
        '媒体不存在',
        undefined,
        404
      )
    }

    // 检查权限
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && media.userId !== user.id) {
      return errorResponse(
        res,
        'FORBIDDEN',
        '没有权限操作此媒体',
        undefined,
        403
      )
    }

    // 根据请求方法处理不同的操作
    switch (req.method) {
      case 'GET':
        return handleGetMediaTags(req, res, media)
      case 'PUT':
        return handleUpdateMediaTags(req, res, media)
      case 'DELETE':
        return handleDeleteMediaTags(req, res, media)
      default:
        return errorResponse(
          res,
          'METHOD_NOT_ALLOWED',
          '不支持的请求方法',
          undefined,
          405
        )
    }
  })
)

/**
 * 获取媒体的标签
 */
async function handleGetMediaTags(req: NextApiRequest, res: NextApiResponse, media: any) {
  // 查询媒体的标签
  const mediaWithTags = await prisma.media.findUnique({
    where: {
      id: media.id,
    },
    include: {
      mediaTags: true,
    },
  })

  if (!mediaWithTags) {
    return errorResponse(res, 'MEDIA_NOT_FOUND', '媒体文件不存在', undefined, 404)
  }

  // 返回标签列表
  return successResponse(res, mediaWithTags.mediaTags)
}

/**
 * 更新媒体的标签
 */
async function handleUpdateMediaTags(req: NextApiRequest, res: NextApiResponse, media: any) {
  // 验证请求数据
  const validation = updateTagsSchema.safeParse(req.body)
  if (!validation.success) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '无效的请求数据',
      validation.error.errors,
      400
    )
  }

  const { tagIds } = validation.data

  // 验证标签是否存在
  if (tagIds.length > 0) {
    const tags = await prisma.mediaTag.findMany({
      where: {
        id: { in: tagIds },
        // MediaTag模型没有deletedAt字段，移除此条件
      },
    })

    if (tags.length !== tagIds.length) {
      return errorResponse(
        res,
        'INVALID_TAGS',
        '部分标签不存在',
        undefined,
        400
      )
    }
  }

  // 更新媒体标签关联
  await prisma.$transaction(async (tx) => {
    // 断开现有的标签关联
    await tx.media.update({
      where: {
        id: media.id,
      },
      data: {
        mediaTags: {
          set: [], // 清空现有关联
        },
      },
    })

    // 创建新的标签关联
    if (tagIds.length > 0) {
      await tx.media.update({
        where: {
          id: media.id,
        },
        data: {
          mediaTags: {
            connect: tagIds.map(tagId => ({ id: tagId })),
          },
        },
      })
    }
  })

  // 查询更新后的标签
  const updatedMedia = await prisma.media.findUnique({
    where: {
      id: media.id,
    },
    include: {
      mediaTags: true,
    },
  })

  // 返回更新后的标签列表
  return successResponse(res, updatedMedia?.mediaTags || [])
}

/**
 * 删除媒体的标签
 */
async function handleDeleteMediaTags(req: NextApiRequest, res: NextApiResponse, media: any) {
  // 获取要删除的标签ID
  const { tagId } = req.query

  if (tagId) {
    // 删除指定标签关联
    await prisma.media.update({
      where: {
        id: media.id,
      },
      data: {
        mediaTags: {
          disconnect: { id: parseInt(tagId as string) },
        },
      },
    })
  } else {
    // 删除所有标签关联
    await prisma.media.update({
      where: {
        id: media.id,
      },
      data: {
        mediaTags: {
          set: [], // 清空所有关联
        },
      },
    })
  }

  // 返回删除结果
  return successResponse(res, { success: true })
}
