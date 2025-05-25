import { NextApiRequest, NextApiResponse } from 'next'
import { hash } from 'bcrypt'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'

// 请求验证模式
const resetPasswordSchema = z.object({
  token: z.string().min(1, '重置令牌不能为空'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
    .regex(/[a-z]/, '密码需要包含至少一个小写字母')
    .regex(/[0-9]/, '密码需要包含至少一个数字'),
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
    const validationResult = resetPasswordSchema.safeParse(req.body)
    
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
    
    const { token, password } = validationResult.data
    
    // 查找重置令牌
    // 注意：这里假设我们有一个PasswordReset模型来存储重置令牌
    // 由于当前数据模型中没有这个表，我们需要添加它，或者使用其他方式存储重置令牌
    // 这里仅作为示例，实际实现可能需要调整
    
    // 模拟查找重置令牌
    // 在实际实现中，应该从数据库中查找重置令牌
    const resetRecord = {
      token,
      userId: 1, // 模拟用户ID
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 模拟过期时间（1小时后）
      createdAt: new Date(),
    }
    
    // 检查令牌是否存在
    if (!resetRecord) {
      return errorResponse(
        res,
        'INVALID_TOKEN',
        '无效的重置令牌',
        undefined,
        400
      )
    }
    
    // 检查令牌是否过期
    if (resetRecord.expiresAt < new Date()) {
      return errorResponse(
        res,
        'TOKEN_EXPIRED',
        '重置令牌已过期',
        undefined,
        400
      )
    }
    
    // 哈希新密码
    const hashedPassword = await hash(password, 10)
    
    // 更新用户密码
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    })
    
    // 删除重置令牌
    // 在实际实现中，应该从数据库中删除重置令牌
    
    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'AUTH',
        action: 'RESET_PASSWORD',
        message: `用户重置密码成功`,
        details: JSON.stringify({ userId: resetRecord.userId }),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })
    
    return successResponse(
      res,
      null,
      '密码重置成功'
    )
  } catch (error: any) {
    console.error('重置密码失败:', error)
    
    return errorResponse(
      res,
      'SERVER_ERROR',
      '重置密码失败，请稍后重试',
      error.message,
      500
    )
  }
}

export default withErrorHandler(handler)
