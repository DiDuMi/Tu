import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'

// 请求验证模式
const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    // 验证请求数据
    const validationResult = forgotPasswordSchema.safeParse(req.body)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))
      
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        errors,
        422
      )
    }
    
    const { email } = validationResult.data
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // 即使用户不存在，也返回成功响应，以防止用户枚举攻击
    if (!user) {
      return successResponse(
        res,
        null,
        '如果该邮箱地址存在，我们将向其发送重置密码的邮件'
      )
    }
    
    // 生成重置令牌
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    
    // 设置令牌过期时间（1小时后）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    // 存储重置令牌
    // 注意：这里假设我们有一个PasswordReset模型来存储重置令牌
    // 由于当前数据模型中没有这个表，我们需要添加它，或者使用其他方式存储重置令牌
    // 这里仅作为示例，实际实现可能需要调整
    
    // TODO: 发送重置密码邮件
    // 这里应该调用邮件发送服务，发送包含重置密码链接的邮件
    // 重置密码链接应该包含重置令牌，例如: /auth/reset-password?token=xxx
    
    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'AUTH',
        action: 'FORGOT_PASSWORD',
        message: `发送重置密码邮件: ${email}`,
        details: JSON.stringify({ userId: user.id, email }),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })
    
    return successResponse(
      res,
      null,
      '如果该邮箱地址存在，我们将向其发送重置密码的邮件'
    )
  } catch (error: any) {
    console.error('发送重置密码邮件失败:', error)
    
    return errorResponse(
      res,
      'SERVER_ERROR',
      '发送重置密码邮件失败，请稍后重试',
      error.message,
      500
    )
  }
}

export default withErrorHandler(handler)
