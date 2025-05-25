import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 推荐查询参数验证模式
const recommendQuerySchema = z.object({
  tags: z.string().optional(), // 逗号分隔的标签名称
  tagIds: z.string().optional(), // 逗号分隔的标签ID
  limit: z.string().transform(Number).default('10'),
  type: z.enum(['HEADER', 'FOOTER', 'GENERAL']).optional()
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '不支持的请求方法' }
    })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: '请先登录' }
    })
  }

  const userId = parseInt(session.user.id as string)

  try {
    const query = recommendQuerySchema.parse(req.query)
    
    let tagIds: number[] = []

    // 处理标签ID
    if (query.tagIds) {
      tagIds = query.tagIds.split(',').map(Number).filter(Boolean)
    }

    // 处理标签名称，转换为ID
    if (query.tags && !query.tagIds) {
      const tagNames = query.tags.split(',').map(name => name.trim()).filter(Boolean)
      if (tagNames.length > 0) {
        const tags = await prisma.tag.findMany({
          where: {
            name: { in: tagNames }
          },
          select: { id: true }
        })
        tagIds = tags.map(tag => tag.id)
      }
    }

    // 构建查询条件
    const where: any = {
      deletedAt: null,
      isActive: true,
      OR: [
        { userId }, // 用户自己的模板
        { isPublic: true } // 公开模板
      ]
    }

    // 类型筛选
    if (query.type) {
      where.type = query.type
    }

    let templates = []

    if (tagIds.length > 0) {
      // 有标签时，按标签匹配度排序
      templates = await prisma.contentTemplate.findMany({
        where: {
          ...where,
          templateTags: {
            some: {
              tagId: { in: tagIds }
            }
          }
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
          },
          _count: {
            select: {
              templateTags: {
                where: {
                  tagId: { in: tagIds }
                }
              }
            }
          }
        },
        orderBy: [
          { useCount: 'desc' }, // 使用次数优先
          { createdAt: 'desc' }
        ],
        take: query.limit
      })

      // 按标签匹配度重新排序
      templates.sort((a, b) => {
        const aMatchCount = a._count.templateTags
        const bMatchCount = b._count.templateTags
        
        if (aMatchCount !== bMatchCount) {
          return bMatchCount - aMatchCount // 匹配度高的优先
        }
        
        return b.useCount - a.useCount // 使用次数高的优先
      })
    } else {
      // 没有标签时，按使用次数和创建时间排序
      templates = await prisma.contentTemplate.findMany({
        where,
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
        },
        orderBy: [
          { useCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: query.limit
      })
    }

    // 格式化返回数据
    const formattedTemplates = templates.map(template => ({
      ...template,
      tags: template.templateTags.map(tt => tt.tag),
      matchScore: tagIds.length > 0 ? 
        template.templateTags.filter(tt => tagIds.includes(tt.tagId)).length / tagIds.length : 0,
      templateTags: undefined,
      _count: undefined
    }))

    return res.status(200).json({
      success: true,
      data: {
        items: formattedTemplates,
        query: {
          tags: query.tags,
          tagIds: tagIds,
          type: query.type,
          limit: query.limit
        }
      }
    })

  } catch (error) {
    console.error('Template recommendation API error:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
    })
  }
}
