import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ApiResponse, MediaCategoryResponse } from '@/types/api'

// 辅助函数：创建错误响应
function createErrorResponse(code: string, message: string, details?: any): ApiResponse<any> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  }
}

// 辅助函数：创建成功响应
function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

// 验证更新分类的请求体
const updateCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空'),
  description: z.string().optional(),
  slug: z.string().min(1, '分类别名不能为空').regex(/^[a-z0-9-]+$/, '别名只能包含小写字母、数字和连字符'),
  parentId: z.string().optional().transform(val => val ? parseInt(val) : null),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MediaCategoryResponse>>
) {
  // 获取会话信息
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return res.status(401).json(createErrorResponse('UNAUTHORIZED', '未授权访问'))
  }

  // 检查用户权限
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
    return res.status(403).json({
      success: false,
      message: '没有权限执行此操作',
    })
  }

  // 获取分类ID
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: '无效的分类ID',
    })
  }

  // 根据请求方法处理不同的操作
  switch (req.method) {
    case 'GET':
      return getCategory(req, res, id)
    case 'PUT':
      return updateCategory(req, res, id)
    case 'DELETE':
      return deleteCategory(req, res, id)
    default:
      return res.status(405).json({
        success: false,
        message: '不支持的请求方法',
      })
  }
}

/**
 * 获取单个媒体分类
 */
async function getCategory(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MediaCategoryResponse>>,
  id: string
) {
  try {
    // 查找分类
    const category = await prisma.mediaCategory.findUnique({
      where: { uuid: id },
      include: {
        parent: true,
        children: true,
      },
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      })
    }

    return res.status(200).json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('获取媒体分类失败:', error)
    return res.status(500).json({
      success: false,
      message: '获取媒体分类失败',
    })
  }
}

/**
 * 更新媒体分类
 */
async function updateCategory(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MediaCategoryResponse>>,
  id: string
) {
  try {
    // 验证请求体
    const validationResult = updateCategorySchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: '请求参数无效',
        errors: validationResult.error.errors,
      })
    }

    const { name, description, slug, parentId } = validationResult.data

    // 查找要更新的分类
    const category = await prisma.mediaCategory.findUnique({
      where: { uuid: id },
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      })
    }

    // 检查slug是否已被其他分类使用
    if (slug !== category.slug) {
      const existingCategory = await prisma.mediaCategory.findUnique({
        where: { slug },
      })

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: '分类别名已存在',
        })
      }
    }

    // 如果指定了父分类，检查父分类是否存在且不是自己或自己的子分类
    if (parentId !== null && parentId !== category.parentId) {
      // 检查父分类是否存在
      const parentCategory = await prisma.mediaCategory.findUnique({
        where: { id: parentId },
      })

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: '父分类不存在',
        })
      }

      // 检查是否形成循环引用
      if (parentId === category.id) {
        return res.status(400).json({
          success: false,
          message: '不能将分类设为自己的父分类',
        })
      }

      // 检查是否选择了自己的子分类作为父分类
      const childCategories = await prisma.mediaCategory.findMany({
        where: { parentId: category.id },
      })

      const isChildCategory = (childId: number, targetId: number): boolean => {
        return childId === targetId || childCategories.some(child => child.id === childId)
      }

      if (isChildCategory(parentId, category.id)) {
        return res.status(400).json({
          success: false,
          message: '不能选择子分类作为父分类',
        })
      }
    }

    // 更新分类
    const updatedCategory = await prisma.mediaCategory.update({
      where: { uuid: id },
      data: {
        name,
        description,
        slug,
        parentId,
      },
    })

    return res.status(200).json({
      success: true,
      data: updatedCategory,
      message: '分类更新成功',
    })
  } catch (error) {
    console.error('更新媒体分类失败:', error)
    return res.status(500).json({
      success: false,
      message: '更新媒体分类失败',
    })
  }
}

/**
 * 删除媒体分类
 */
async function deleteCategory(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ message: string }>>,
  id: string
) {
  try {
    // 查找要删除的分类
    const category = await prisma.mediaCategory.findUnique({
      where: { uuid: id },
      include: {
        children: true,
        media: {
          take: 1, // 只需要检查是否有媒体，不需要获取所有媒体
        },
      },
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在',
      })
    }

    // 检查是否有子分类
    if (category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除含有子分类的分类',
      })
    }

    // 检查是否有关联的媒体
    if (category.media.length > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除含有媒体文件的分类',
      })
    }

    // 删除分类
    await prisma.mediaCategory.delete({
      where: { uuid: id },
    })

    return res.status(200).json({
      success: true,
      message: '分类删除成功',
    })
  } catch (error) {
    console.error('删除媒体分类失败:', error)
    return res.status(500).json({
      success: false,
      message: '删除媒体分类失败',
    })
  }
}
