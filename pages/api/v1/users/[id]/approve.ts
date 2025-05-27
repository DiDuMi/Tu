import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withErrorHandler, withAdmin } from '@/lib/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api'

// 审核请求验证模式
const approveSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: '操作类型必须是 approve 或 reject' }),
  }),
  reason: z.string().max(500, '审核原因不能超过500个字符').optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  const { id } = req.query

  // 验证用户ID
  if (!id || (isNaN(Number(id)) && typeof id !== 'string')) {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的用户ID',
      undefined,
      400
    )
  }

  try {
    // 验证请求数据
    const validationResult = approveSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { action, reason } = validationResult.data

    // 查询用户
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: isNaN(Number(id)) ? undefined : Number(id) },
          { uuid: Array.isArray(id) ? id[0] : id },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        status: true,
        applicationReason: true,
        createdAt: true,
      },
    })

    if (!user) {
      return notFoundResponse(res, '用户不存在')
    }

    // 检查用户状态
    if (user.status !== 'PENDING') {
      return errorResponse(
        res,
        'INVALID_STATUS',
        '只能审核待审核状态的用户',
        undefined,
        400
      )
    }

    // 执行审核操作
    const newStatus = action === 'approve' ? 'ACTIVE' : 'REJECTED'

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    })

    // 记录审核日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'USER_MANAGEMENT',
        action: action === 'approve' ? 'USER_APPROVED' : 'USER_REJECTED',
        message: `用户 ${user.name} (${user.email}) 被${action === 'approve' ? '批准' : '拒绝'}`,
        details: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          action,
          reason: reason || null,
          applicationReason: user.applicationReason,
        }),
        createdAt: new Date(),
      },
    })

    const actionText = action === 'approve' ? '批准' : '拒绝'
    return successResponse(
      res,
      updatedUser,
      `用户${actionText}成功`
    )
  } catch (error) {
    console.error('用户审核失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '用户审核失败',
      undefined,
      500
    )
  }
}

export default withErrorHandler(withAdmin(handler))
