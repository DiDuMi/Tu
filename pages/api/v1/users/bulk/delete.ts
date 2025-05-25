import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const bulkDeleteSchema = z.object({
  userIds: z.array(z.number()).min(1, '至少需要选择一个用户'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 验证请求数据
    const validationResult = bulkDeleteSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { userIds } = validationResult.data

    // 批量软删除用户
    const deleteResult = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
        // 防止删除管理员账户
        role: { not: 'ADMIN' },
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return successResponse(res, { 
      count: deleteResult.count,
    }, `成功删除 ${deleteResult.count} 个用户`)
  } catch (error) {
    console.error('批量删除用户失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '批量删除用户失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
