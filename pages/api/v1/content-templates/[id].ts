import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 更新模板的验证模式
const updateTemplateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  type: z.enum(['HEADER', 'FOOTER', 'GENERAL']).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
  sortOrder: z.number().optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' }
    })
  }

  const userId = parseInt(session.user.id as string)
  const templateId = parseInt(req.query.id as string)

  if (isNaN(templateId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: '无效的模板ID' }
    })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, templateId, userId)
      case 'PUT':
        return await handlePut(req, res, templateId, userId)
      case 'DELETE':
        return await handleDelete(req, res, templateId, userId)
      default:
        return res.status(405).json({
          success: false,
          error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' }
        })
    }
  } catch (error) {
    console.error('Content template API error:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
    })
  }
}

// 获取单个模板
async function handleGet(req: NextApiRequest, res: NextApiResponse, templateId: number, userId: number) {
  const template = await prisma.contentTemplate.findFirst({
    where: {
      id: templateId,
      deletedAt: null,
      OR: [
        { userId }, // 用户自己的模板
        { isPublic: true } // 公开模板
      ]
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true }
      },
      templateTags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true }
          }
        }
      }
    }
  })

  if (!template) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '模板不存在' }
    })
  }

  return res.status(200).json({
    success: true,
    data: {
      ...template,
      tags: template.templateTags.map(tt => tt.tag),
      templateTags: undefined
    }
  })
}

// 更新模板
async function handlePut(req: NextApiRequest, res: NextApiResponse, templateId: number, userId: number) {
  const data = updateTemplateSchema.parse(req.body)

  // 检查模板是否存在且用户有权限修改
  const existingTemplate = await prisma.contentTemplate.findFirst({
    where: {
      id: templateId,
      userId,
      deletedAt: null
    }
  })

  if (!existingTemplate) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '模板不存在或无权限修改' }
    })
  }

  // 更新模板
  const template = await prisma.$transaction(async (tx) => {
    // 如果有标签更新，先删除旧的关联
    if (data.tagIds !== undefined) {
      await tx.templateTag.deleteMany({
        where: { templateId }
      })
    }

    // 更新模板
    const updatedTemplate = await tx.contentTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.tagIds !== undefined && {
          templateTags: {
            create: data.tagIds.map(tagId => ({ tagId }))
          }
        })
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        },
        templateTags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      }
    })

    return updatedTemplate
  })

  return res.status(200).json({
    success: true,
    data: {
      ...template,
      tags: template.templateTags.map(tt => tt.tag),
      templateTags: undefined
    }
  })
}

// 删除模板（软删除）
async function handleDelete(req: NextApiRequest, res: NextApiResponse, templateId: number, userId: number) {
  // 检查模板是否存在且用户有权限删除
  const existingTemplate = await prisma.contentTemplate.findFirst({
    where: {
      id: templateId,
      userId,
      deletedAt: null
    }
  })

  if (!existingTemplate) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: '模板不存在或无权限删除' }
    })
  }

  // 软删除模板
  await prisma.contentTemplate.update({
    where: { id: templateId },
    data: { deletedAt: new Date() }
  })

  return res.status(200).json({
    success: true,
    data: { message: '模板已删除' }
  })
}
