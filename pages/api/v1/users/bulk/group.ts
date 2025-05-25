import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const bulkUpdateGroupSchema = z.object({
  userIds: z.array(z.number()).min(1, '至少需要选择一个用户'),
  userGroupId: z.number().nullable(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 验证请求数据
    const validationResult = bulkUpdateGroupSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { userIds, userGroupId } = validationResult.data

    // 如果提供了用户组ID，检查用户组是否存在
    if (userGroupId !== null) {
      const userGroup = await prisma.userGroup.findUnique({
        where: { id: userGroupId },
      })

      if (!userGroup) {
        return errorResponse(
          res,
          'USER_GROUP_NOT_FOUND',
          '用户组不存在',
          undefined,
          404
        )
      }
    }

    // 批量更新用户的用户组
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      data: {
        userGroupId,
        updatedAt: new Date(),
      },
    })

    return successResponse(res, { 
      count: updateResult.count,
      userGroupId,
    }, `成功更新 ${updateResult.count} 个用户的用户组`)
  } catch (error) {
    console.error('批量更新用户组失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '批量更新用户组失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
