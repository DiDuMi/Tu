import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET方法
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return errorResponse(
      res,
      'INVALID_TOKEN',
      '无效的重置令牌',
      undefined,
      400
    )
  }

  try {
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
    
    return successResponse(
      res,
      { valid: true },
      '重置令牌有效'
    )
  } catch (error: any) {
    console.error('验证重置令牌失败:', error)
    
    return errorResponse(
      res,
      'SERVER_ERROR',
      '验证重置令牌失败，请稍后重试',
      error.message,
      500
    )
  }
}

export default withErrorHandler(handler)
