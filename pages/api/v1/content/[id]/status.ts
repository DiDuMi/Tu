import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { z } from 'zod'
import { transitionContentStatus, ContentStatus } from '@/lib/content-workflow'
import { withErrorHandler } from '@/lib/middleware'

// 请求验证模式
const statusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']),
  feedback: z.string().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许PATCH方法
  if (req.method !== 'PATCH') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '方法不允许',
      },
    })
  }

  // 获取会话信息
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未授权',
      },
    })
  }

  try {
    // 获取内容ID
    const contentId = parseInt(req.query.id as string)

    if (isNaN(contentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_ID',
          message: '无效的内容ID',
        },
      })
    }

    // 验证请求数据
    const validationResult = statusUpdateSchema.safeParse(req.body)

    if (!validationResult.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details: validationResult.error.format(),
        },
      })
    }

    const { status, feedback } = validationResult.data

    // 执行状态转换
    const result = await transitionContentStatus(
      contentId,
      status as ContentStatus,
      parseInt(session.user.id),
      feedback
    )

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'STATUS_TRANSITION_FAILED',
          message: result.message,
        },
      })
    }

    return res.status(200).json({
      success: true,
      data: result.content,
      message: result.message,
    })
  } catch (error) {
    console.error('内容状态更新失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '内容状态更新失败',
      },
    })
  }
}

export default withErrorHandler(handler)
