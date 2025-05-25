import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { v4 as uuidv4 } from 'uuid'

// 请求验证模式
const createTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过50个字符'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').optional(),
  description: z.string().max(500, '标签描述不能超过500个字符').optional(),
})

const updateTagSchema = createTagSchema.partial()

/**
 * 媒体标签API
 * 支持获取、创建、更新和删除媒体标签
 */
export default withErrorHandler(
  withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
    // 根据请求方法处理不同的操作
    switch (req.method) {
      case 'GET':
        return handleGetTags(req, res, user)
      case 'POST':
        return handleCreateTag(req, res, user)
      case 'PUT':
        return handleUpdateTag(req, res, user)
      case 'DELETE':
        return handleDeleteTag(req, res, user)
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
 * 获取媒体标签列表
 */
async function handleGetTags(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 解析查询参数
  const { search, includeMedia } = req.query

  // 构建查询条件
  const where: any = {
    // MediaTag模型没有deletedAt字段，移除此条件
  }

  // 按名称搜索
  if (search) {
    where.name = {
      contains: search as string,
    }
  }

  // 解析排序参数
  const sortBy = req.query.sortBy as string || 'name';
  const sortDirection = req.query.sortDirection as 'asc' | 'desc' || 'asc';

  // 构建排序条件
  const orderBy: any = {};

  // MediaTag模型中只有name, color, description, createdAt, updatedAt等字段
  // 确保只使用存在的字段进行排序
  if (['name', 'createdAt', 'updatedAt'].includes(sortBy)) {
    orderBy[sortBy] = sortDirection;
  } else {
    // 默认按名称排序
    orderBy.name = 'asc';
  }

  // 查询标签
  const tags = await prisma.mediaTag.findMany({
    where,
    include: {
      _count: includeMedia === 'true' ? {
        select: {
          media: true, // 使用正确的关系名称
        },
      } : undefined,
    },
    orderBy,
  })

  // 返回标签列表
  return successResponse(res, tags)
}

/**
 * 创建媒体标签
 */
async function handleCreateTag(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限创建标签',
      undefined,
      403
    )
  }

  // 验证请求数据
  const validation = createTagSchema.safeParse(req.body)
  if (!validation.success) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '无效的请求数据',
      validation.error.errors,
      400
    )
  }

  const { name, color, description } = validation.data

  // 检查标签名称是否已存在
  const existingTag = await prisma.mediaTag.findFirst({
    where: {
      name,
      deletedAt: null,
    },
  })

  if (existingTag) {
    return errorResponse(
      res,
      'DUPLICATE_NAME',
      '标签名称已存在',
      undefined,
      400
    )
  }

  // 创建标签
  const tag = await prisma.mediaTag.create({
    data: {
      uuid: uuidv4(),
      name,
      color,
      description,
    },
  })

  // 返回创建的标签
  return successResponse(res, tag)
}

/**
 * 更新媒体标签
 */
async function handleUpdateTag(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限更新标签',
      undefined,
      403
    )
  }

  // 获取标签ID
  const { id } = req.query
  if (!id) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '缺少标签ID',
      undefined,
      400
    )
  }

  // 验证请求数据
  const validation = updateTagSchema.safeParse(req.body)
  if (!validation.success) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '无效的请求数据',
      validation.error.errors,
      400
    )
  }

  const { name, color, description } = validation.data

  // 查询标签
  const tag = await prisma.mediaTag.findUnique({
    where: { id: parseInt(id as string) },
  })

  if (!tag || tag.deletedAt) {
    return errorResponse(
      res,
      'TAG_NOT_FOUND',
      '标签不存在',
      undefined,
      404
    )
  }

  // 如果更新名称，检查名称是否已存在
  if (name && name !== tag.name) {
    const existingTag = await prisma.mediaTag.findFirst({
      where: {
        name,
        id: { not: tag.id },
        deletedAt: null,
      },
    })

    if (existingTag) {
      return errorResponse(
        res,
        'DUPLICATE_NAME',
        '标签名称已存在',
        undefined,
        400
      )
    }
  }

  // 更新标签
  const updatedTag = await prisma.mediaTag.update({
    where: { id: tag.id },
    data: {
      name: name !== undefined ? name : undefined,
      color: color !== undefined ? color : undefined,
      description: description !== undefined ? description : undefined,
      updatedAt: new Date(),
    },
  })

  // 返回更新后的标签
  return successResponse(res, updatedTag)
}

/**
 * 删除媒体标签
 */
async function handleDeleteTag(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限删除标签',
      undefined,
      403
    )
  }

  // 获取标签ID
  const { id } = req.query
  if (!id) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '缺少标签ID',
      undefined,
      400
    )
  }

  // 查询标签
  const tag = await prisma.mediaTag.findUnique({
    where: { id: parseInt(id as string) },
    include: {
      _count: {
        select: {
          media: true,
        },
      },
    },
  })

  if (!tag || tag.deletedAt) {
    return errorResponse(
      res,
      'TAG_NOT_FOUND',
      '标签不存在',
      undefined,
      404
    )
  }

  // 检查是否有关联的媒体
  if (tag._count.media > 0) {
    // 可以选择解除关联或返回错误
    const { force } = req.query

    if (force === 'true') {
      // 解除所有关联
      // 注意：根据Prisma模型，MediaTag和Media是多对多关系，没有明确的mediaTagRelation表
      // 使用更新操作解除关联
      await prisma.mediaTag.update({
        where: { id: tag.id },
        data: {
          media: {
            set: [], // 清空关联
          },
        },
      })
    } else {
      return errorResponse(
        res,
        'HAS_MEDIA',
        '该标签下有媒体，无法删除',
        undefined,
        400
      )
    }
  }

  // 软删除标签
  const deletedTag = await prisma.mediaTag.update({
    where: { id: tag.id },
    data: {
      deletedAt: new Date(),
    },
  })

  // 返回删除结果
  return successResponse(res, { success: true, id: deletedTag.id })
}
