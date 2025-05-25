import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 重排序验证模式
const reorderSchema = z.object({
  templateIds: z.array(z.number()).min(1, '至少需要一个模板ID')
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
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
    const { templateIds } = reorderSchema.parse(req.body)

    // 验证所有模板都属于当前用户
    const templates = await prisma.contentTemplate.findMany({
      where: {
        id: { in: templateIds },
        userId,
        deletedAt: null
      },
      select: { id: true }
    })

    if (templates.length !== templateIds.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TEMPLATES', message: '包含无效的模板ID' }
      })
    }

    // 批量更新排序
    const updatePromises = templateIds.map((templateId, index) =>
      prisma.contentTemplate.update({
        where: { id: templateId },
        data: { sortOrder: index }
      })
    )

    await Promise.all(updatePromises)

    return res.status(200).json({
      success: true,
      data: { message: '排序已更新' }
    })

  } catch (error) {
    console.error('Template reorder API error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0].message }
      })
    }

    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
    })
  }
}
