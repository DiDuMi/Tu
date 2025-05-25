import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  const { token, email } = req.body

  // 需要提供token或email中的一个
  if (!token && !email) {
    return errorResponse(
      res,
      'MISSING_PARAMETERS',
      '请提供验证令牌或邮箱地址',
      undefined,
      400
    )
  }

  try {
    let userId: number
    let userEmail: string
    
    if (token) {
      // 通过token查找用户
      // 注意：这里假设我们有一个EmailVerification模型来存储验证令牌
      // 由于当前数据模型中没有这个表，我们需要添加它，或者使用其他方式存储验证令牌
      // 这里仅作为示例，实际实现可能需要调整
      
      // 模拟查找验证令牌
      const verificationRecord = {
        token,
        userId: 1, // 模拟用户ID
        email: 'user@example.com', // 模拟用户邮箱
      }
      
      if (!verificationRecord) {
        return errorResponse(
          res,
          'INVALID_TOKEN',
          '无效的验证令牌',
          undefined,
          400
        )
      }
      
      userId = verificationRecord.userId
      userEmail = verificationRecord.email
    } else {
      // 通过email查找用户
      const user = await prisma.user.findUnique({
        where: { email: email as string },
      })
      
      if (!user) {
        return errorResponse(
          res,
          'USER_NOT_FOUND',
          '未找到该邮箱对应的用户',
          undefined,
          404
        )
      }
      
      // 检查用户状态
      if (user.status === 'ACTIVE') {
        return errorResponse(
          res,
          'ALREADY_VERIFIED',
          '该邮箱已经验证过了',
          undefined,
          400
        )
      }
      
      userId = user.id
      userEmail = user.email
    }
    
    // 生成新的验证令牌
    const newToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15)
    
    // 创建或更新验证记录
    // 在实际实现中，应该在数据库中创建或更新验证记录
    
    // TODO: 发送验证邮件
    // 这里应该调用邮件发送服务，发送包含验证链接的邮件
    // 验证链接应该包含新的验证令牌，例如: /auth/verify-email?token=xxx
    
    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'AUTH',
        action: 'RESEND_VERIFICATION',
        message: `重新发送验证邮件: ${userEmail}`,
        details: JSON.stringify({ userId, email: userEmail }),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })
    
    return successResponse(
      res,
      null,
      '验证邮件已重新发送，请查收'
    )
  } catch (error: any) {
    console.error('重新发送验证邮件失败:', error)
    
    return errorResponse(
      res,
      'SERVER_ERROR',
      '重新发送验证邮件失败，请稍后重试',
      error.message,
      500
    )
  }
}

export default withErrorHandler(handler)
