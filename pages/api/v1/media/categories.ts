import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { v4 as uuidv4 } from 'uuid'

// 请求验证模式
const createCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  slug: z.string().min(1, '分类别名不能为空').max(50, '分类别名不能超过50个字符')
    .regex(/^[a-z0-9-]+$/, '分类别名只能包含小写字母、数字和连字符')
    .optional(),
  description: z.string().max(500, '分类描述不能超过500个字符').optional(),
  parentId: z.number().optional(),
})

const updateCategorySchema = createCategorySchema.partial()

/**
 * 媒体分类API
 * 支持获取、创建、更新和删除媒体分类
 */
export default withErrorHandler(
  withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
    // 根据请求方法处理不同的操作
    switch (req.method) {
      case 'GET':
        return handleGetCategories(req, res, user)
      case 'POST':
        return handleCreateCategory(req, res, user)
      case 'PUT':
        return handleUpdateCategory(req, res, user)
      case 'DELETE':
        return handleDeleteCategory(req, res, user)
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
 * 获取媒体分类列表
 */
async function handleGetCategories(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 解析查询参数
  const { parentId, includeMedia } = req.query

  // 构建查询条件
  const where: any = {
    // MediaCategory模型没有deletedAt字段，移除此条件
  }

  // 按父分类筛选
  if (parentId === 'null' || parentId === 'undefined') {
    where.parentId = null
  } else if (parentId) {
    where.parentId = parseInt(parentId as string)
  }

  // 查询分类
  const categories = await prisma.mediaCategory.findMany({
    where,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          uuid: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          uuid: true,
        },
      },
      _count: includeMedia === 'true' ? {
        select: {
          media: true,
        },
      } : undefined,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // 返回分类列表
  return successResponse(res, categories)
}

/**
 * 创建媒体分类
 */
async function handleCreateCategory(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限创建分类',
      undefined,
      403
    )
  }

  // 验证请求数据
  const validation = createCategorySchema.safeParse(req.body)
  if (!validation.success) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '无效的请求数据',
      validation.error.errors,
      400
    )
  }

  const { name, slug, description, parentId } = validation.data

  // 生成别名
  const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // 检查别名是否已存在
  const existingCategory = await prisma.mediaCategory.findFirst({
    where: {
      slug: finalSlug,
      deletedAt: null,
    },
  })

  if (existingCategory) {
    return errorResponse(
      res,
      'DUPLICATE_SLUG',
      '分类别名已存在',
      undefined,
      400
    )
  }

  // 如果指定了父分类，检查父分类是否存在
  if (parentId) {
    const parentCategory = await prisma.mediaCategory.findUnique({
      where: { id: parentId },
    })

    if (!parentCategory || parentCategory.deletedAt) {
      return errorResponse(
        res,
        'PARENT_NOT_FOUND',
        '父分类不存在',
        undefined,
        400
      )
    }
  }

  // 创建分类
  const category = await prisma.mediaCategory.create({
    data: {
      uuid: uuidv4(),
      name,
      slug: finalSlug,
      description,
      parentId,
      createdBy: user.id,
    },
  })

  // 返回创建的分类
  return successResponse(res, category)
}

/**
 * 更新媒体分类
 */
async function handleUpdateCategory(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限更新分类',
      undefined,
      403
    )
  }

  // 获取分类ID
  const { id } = req.query
  if (!id) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '缺少分类ID',
      undefined,
      400
    )
  }

  // 验证请求数据
  const validation = updateCategorySchema.safeParse(req.body)
  if (!validation.success) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '无效的请求数据',
      validation.error.errors,
      400
    )
  }

  const { name, slug, description, parentId } = validation.data

  // 查询分类
  const category = await prisma.mediaCategory.findUnique({
    where: { id: parseInt(id as string) },
  })

  if (!category || category.deletedAt) {
    return errorResponse(
      res,
      'CATEGORY_NOT_FOUND',
      '分类不存在',
      undefined,
      404
    )
  }

  // 如果更新别名，检查别名是否已存在
  if (slug && slug !== category.slug) {
    const existingCategory = await prisma.mediaCategory.findFirst({
      where: {
        slug,
        id: { not: category.id },
        deletedAt: null,
      },
    })

    if (existingCategory) {
      return errorResponse(
        res,
        'DUPLICATE_SLUG',
        '分类别名已存在',
        undefined,
        400
      )
    }
  }

  // 如果指定了父分类，检查父分类是否存在，并防止循环引用
  if (parentId && parentId !== category.parentId) {
    // 不能将自己设为自己的父分类
    if (parentId === category.id) {
      return errorResponse(
        res,
        'INVALID_PARENT',
        '不能将分类设为自己的父分类',
        undefined,
        400
      )
    }

    const parentCategory = await prisma.mediaCategory.findUnique({
      where: { id: parentId },
    })

    if (!parentCategory || parentCategory.deletedAt) {
      return errorResponse(
        res,
        'PARENT_NOT_FOUND',
        '父分类不存在',
        undefined,
        400
      )
    }

    // 检查是否会形成循环引用
    let currentParent = parentCategory
    while (currentParent.parentId) {
      if (currentParent.parentId === category.id) {
        return errorResponse(
          res,
          'CIRCULAR_REFERENCE',
          '不能形成循环引用',
          undefined,
          400
        )
      }

      currentParent = await prisma.mediaCategory.findUnique({
        where: { id: currentParent.parentId },
      })
    }
  }

  // 更新分类
  const updatedCategory = await prisma.mediaCategory.update({
    where: { id: category.id },
    data: {
      name: name !== undefined ? name : undefined,
      slug: slug !== undefined ? slug : undefined,
      description: description !== undefined ? description : undefined,
      parentId: parentId !== undefined ? parentId : undefined,
      updatedAt: new Date(),
    },
  })

  // 返回更新后的分类
  return successResponse(res, updatedCategory)
}

/**
 * 删除媒体分类
 */
async function handleDeleteCategory(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 检查权限
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '没有权限删除分类',
      undefined,
      403
    )
  }

  // 获取分类ID
  const { id } = req.query
  if (!id) {
    return errorResponse(
      res,
      'INVALID_REQUEST',
      '缺少分类ID',
      undefined,
      400
    )
  }

  // 查询分类
  const category = await prisma.mediaCategory.findUnique({
    where: { id: parseInt(id as string) },
    include: {
      children: {
        where: {
          deletedAt: null,
        },
      },
      media: {
        where: {
          deletedAt: null,
        },
        take: 1,
      },
    },
  })

  if (!category || category.deletedAt) {
    return errorResponse(
      res,
      'CATEGORY_NOT_FOUND',
      '分类不存在',
      undefined,
      404
    )
  }

  // 检查是否有子分类
  if (category.children.length > 0) {
    return errorResponse(
      res,
      'HAS_CHILDREN',
      '该分类下有子分类，无法删除',
      undefined,
      400
    )
  }

  // 检查是否有关联的媒体
  if (category.media.length > 0) {
    return errorResponse(
      res,
      'HAS_MEDIA',
      '该分类下有媒体，无法删除',
      undefined,
      400
    )
  }

  // 软删除分类
  const deletedCategory = await prisma.mediaCategory.update({
    where: { id: category.id },
    data: {
      deletedAt: new Date(),
    },
  })

  // 返回删除结果
  return successResponse(res, { success: true, id: deletedCategory.id })
}
