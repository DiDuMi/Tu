import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const bulkUpdateStatusSchema = z.object({
  userIds: z.array(z.number()).min(1, '至少需要选择一个用户'),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: '状态必须是 PENDING, ACTIVE 或 SUSPENDED' })
  }),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 验证请求数据
    const validationResult = bulkUpdateStatusSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { userIds, status } = validationResult.data

    // 批量更新用户状态
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    })

    return successResponse(res, { 
      count: updateResult.count,
      status,
    }, `成功更新 ${updateResult.count} 个用户的状态`)
  } catch (error) {
    console.error('批量更新用户状态失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '批量更新用户状态失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
