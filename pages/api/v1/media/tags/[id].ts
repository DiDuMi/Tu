import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types/api'

// 验证更新标签的请求体
const updateTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
  description: z.string().optional(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, '颜色格式无效').optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  // 获取会话信息
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授权访问',
      },
    })
  }

  // 检查用户权限
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '没有权限执行此操作',
      },
    })
  }

  // 获取标签ID
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TAG_ID',
        message: '无效的标签ID',
      },
    })
  }

  // 根据请求方法处理不同的操作
  switch (req.method) {
    case 'GET':
      return getTag(req, res, id)
    case 'PUT':
      return updateTag(req, res, id)
    case 'DELETE':
      return deleteTag(req, res, id)
    default:
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '不支持的请求方法',
        },
      })
  }
}

/**
 * 获取单个媒体标签
 */
async function getTag(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>,
  id: string
) {
  try {
    // 查找标签
    const tag = await prisma.mediaTag.findUnique({
      where: { uuid: id },
    })

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '标签不存在',
        },
      })
    }

    return res.status(200).json({
      success: true,
      data: tag,
    })
  } catch (error) {
    console.error('获取媒体标签失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取媒体标签失败',
      },
    })
  }
}

/**
 * 更新媒体标签
 */
async function updateTag(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>,
  id: string
) {
  try {
    // 验证请求体
    const validationResult = updateTagSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求参数无效',
          details: validationResult.error.errors,
        },
      })
    }

    const { name, description, color } = validationResult.data

    // 查找要更新的标签
    const tag = await prisma.mediaTag.findUnique({
      where: { uuid: id },
    })

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '标签不存在',
        },
      })
    }

    // 检查标签名称是否已被其他标签使用
    if (name !== tag.name) {
      const existingTag = await prisma.mediaTag.findUnique({
        where: { name },
      })

      if (existingTag) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TAG_NAME_EXISTS',
            message: '标签名称已存在',
          },
        })
      }
    }

    // 更新标签
    const updatedTag = await prisma.mediaTag.update({
      where: { uuid: id },
      data: {
        name,
        description,
        color,
      },
    })

    return res.status(200).json({
      success: true,
      data: updatedTag,
      message: '标签更新成功',
    })
  } catch (error) {
    console.error('更新媒体标签失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '更新媒体标签失败',
      },
    })
  }
}

/**
 * 删除媒体标签
 */
async function deleteTag(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>,
  id: string
) {
  try {
    // 查找要删除的标签
    const tag = await prisma.mediaTag.findUnique({
      where: { uuid: id },
      include: {
        media: {
          take: 1, // 只需要检查是否有媒体，不需要获取所有媒体
        },
      },
    })

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: '标签不存在',
        },
      })
    }

    // 检查是否有关联的媒体
    if (tag.media.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TAG_IN_USE',
          message: '无法删除已被媒体文件使用的标签',
        },
      })
    }

    // 删除标签
    await prisma.mediaTag.delete({
      where: { uuid: id },
    })

    return res.status(200).json({
      success: true,
      data: { deleted: true },
      message: '标签删除成功',
    })
  } catch (error) {
    console.error('删除媒体标签失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '删除媒体标签失败',
      },
    })
  }
}
