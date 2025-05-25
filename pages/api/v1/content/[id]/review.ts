import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// 请求验证模式
const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_CHANGES']),
  content: z.string().min(1, '审核意见不能为空').max(1000, '审核意见不能超过1000个字符'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的内容ID',
      undefined,
      422
    )
  }

  try {
    // 验证请求数据
    const validationResult = reviewSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { status, content } = validationResult.data

    // 查找内容
    const page = await prisma.page.findUnique({
      where: { uuid: id },
    })

    if (!page) {
      return errorResponse(
        res,
        'NOT_FOUND',
        '内容不存在',
        undefined,
        404
      )
    }

    // 检查内容状态是否为待审核
    if (page.status !== 'PENDING_REVIEW') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '只能审核待审核状态的内容',
        undefined,
        422
      )
    }

    // 更新内容状态
    let newStatus = page.status
    if (status === 'APPROVED') {
      newStatus = 'PUBLISHED'
    } else if (status === 'REJECTED') {
      newStatus = 'REJECTED'
    } else if (status === 'NEEDS_CHANGES') {
      newStatus = 'DRAFT'
    }

    // 更新内容
    const updatedPage = await prisma.page.update({
      where: { id: page.id },
      data: {
        status: newStatus,
        ...(status === 'APPROVED' && { publishedAt: new Date() }),
      },
    })

    // 创建审核记录
    const review = await prisma.reviewFeedback.create({
      data: {
        pageId: page.id,
        reviewerId: session?.user?.id ? parseInt(session.user.id) : 0,
        status,
        content,
      },
    })

    return successResponse(res, {
      pageId: page.id,
      status: newStatus,
      reviewId: review.id,
    }, '审核提交成功')
  } catch (error) {
    console.error('提交审核失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '提交审核失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
