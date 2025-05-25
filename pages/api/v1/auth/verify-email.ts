import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET方法
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return errorResponse(
      res,
      'INVALID_TOKEN',
      '无效的验证令牌',
      undefined,
      400
    )
  }

  try {
    // 查找验证令牌
    // 注意：这里假设我们有一个EmailVerification模型来存储验证令牌
    // 由于当前数据模型中没有这个表，我们需要添加它，或者使用其他方式存储验证令牌
    // 这里仅作为示例，实际实现可能需要调整
    
    // 模拟查找验证令牌
    // 在实际实现中，应该从数据库中查找验证令牌
    const verificationRecord = {
      token,
      userId: 1, // 模拟用户ID
      email: 'user@example.com', // 模拟用户邮箱
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 模拟过期时间（24小时后）
      createdAt: new Date(),
    }
    
    // 检查令牌是否存在
    if (!verificationRecord) {
      return errorResponse(
        res,
        'INVALID_TOKEN',
        '无效的验证令牌',
        undefined,
        400
      )
    }
    
    // 检查令牌是否过期
    if (verificationRecord.expiresAt < new Date()) {
      return errorResponse(
        res,
        'TOKEN_EXPIRED',
        '验证令牌已过期',
        undefined,
        400
      )
    }
    
    // 更新用户状态为已激活
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: { status: 'ACTIVE' },
    })
    
    // 删除验证令牌
    // 在实际实现中，应该从数据库中删除验证令牌
    
    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'AUTH',
        action: 'EMAIL_VERIFICATION',
        message: `用户邮箱验证成功: ${verificationRecord.email}`,
        details: JSON.stringify({ userId: verificationRecord.userId, email: verificationRecord.email }),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })
    
    return successResponse(
      res,
      null,
      '邮箱验证成功'
    )
  } catch (error: any) {
    console.error('邮箱验证失败:', error)
    
    return errorResponse(
      res,
      'SERVER_ERROR',
      '邮箱验证失败，请稍后重试',
      error.message,
      500
    )
  }
}

export default withErrorHandler(handler)
