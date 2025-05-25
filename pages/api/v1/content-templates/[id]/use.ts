import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
  const templateId = parseInt(req.query.id as string)

  if (isNaN(templateId)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: '无效的模板ID' }
    })
  }

  try {
    // 检查模板是否存在且用户有权限使用
    const template = await prisma.contentTemplate.findFirst({
      where: {
        id: templateId,
        deletedAt: null,
        isActive: true,
        OR: [
          { userId }, // 用户自己的模板
          { isPublic: true } // 公开模板
        ]
      }
    })

    if (!template) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '模板不存在或无权限使用' }
      })
    }

    // 增加使用次数
    await prisma.contentTemplate.update({
      where: { id: templateId },
      data: { useCount: { increment: 1 } }
    })

    return res.status(200).json({
      success: true,
      data: { message: '使用次数已更新' }
    })

  } catch (error) {
    console.error('Template use API error:', error)
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' }
    })
  }
}
