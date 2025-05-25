/**
 * 增强的API中间件
 * 提供更强大的错误处理、认证和授权功能
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { ApiError, logErrorToDatabase, handleZodError, handlePrismaError } from './error-handler'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// API处理函数类型
export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  session?: any
) => Promise<void>

/**
 * 增强的错误处理中间件
 * 捕获并处理API处理函数中的错误
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withEnhancedErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, res, session) => {
    try {
      await handler(req, res, session)
    } catch (error: any) {
      // 记录错误日志
      await logErrorToDatabase(error, req, session?.user?.id)
      
      // 处理不同类型的错误
      if (error instanceof ApiError) {
        // 自定义API错误
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.type,
            message: error.message,
            details: error.details,
          },
        })
      } else if (error instanceof ZodError) {
        // Zod验证错误
        const apiError = handleZodError(error)
        return res.status(apiError.statusCode).json({
          success: false,
          error: {
            code: apiError.type,
            message: apiError.message,
            details: apiError.details,
          },
        })
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Prisma已知错误
        const apiError = handlePrismaError(error)
        return res.status(apiError.statusCode).json({
          success: false,
          error: {
            code: apiError.type,
            message: apiError.message,
            details: apiError.details,
          },
        })
      } else {
        // 未知错误
        console.error('未捕获的API错误:', error)
        return res.status(500).json({
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: '服务器内部错误',
          },
        })
      }
    }
  }
}

/**
 * 认证中间件
 * 确保请求已经过认证
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withAuthentication(handler: ApiHandler): ApiHandler {
  return withEnhancedErrorHandler(async (req, res) => {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      throw new ApiError('AUTHENTICATION_ERROR', '未认证，请登录后重试', 401)
    }
    
    await handler(req, res, session)
  })
}

/**
 * 角色授权中间件
 * 确保用户具有指定的角色
 * @param roles 允许的角色数组
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withRoleAuthorization(roles: string[], handler: ApiHandler): ApiHandler {
  return withAuthentication(async (req, res, session) => {
    const userRole = session.user.role
    
    if (!roles.includes(userRole)) {
      throw new ApiError('AUTHORIZATION_ERROR', '没有权限执行此操作', 403)
    }
    
    await handler(req, res, session)
  })
}

/**
 * 管理员授权中间件
 * 确保用户是管理员
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withAdminAuthorization(handler: ApiHandler): ApiHandler {
  return withRoleAuthorization(['ADMIN', 'SUPER_ADMIN'], handler)
}

/**
 * 操作员授权中间件
 * 确保用户是操作员或管理员
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withOperatorAuthorization(handler: ApiHandler): ApiHandler {
  return withRoleAuthorization(['OPERATOR', 'ADMIN', 'SUPER_ADMIN'], handler)
}

/**
 * 请求方法验证中间件
 * 确保请求使用了允许的HTTP方法
 * @param allowedMethods 允许的HTTP方法数组
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withMethodValidation(allowedMethods: string[], handler: ApiHandler): ApiHandler {
  return withEnhancedErrorHandler(async (req, res, session) => {
    if (!allowedMethods.includes(req.method!)) {
      throw new ApiError(
        'BAD_REQUEST_ERROR',
        `方法不允许: ${req.method}，允许的方法: ${allowedMethods.join(', ')}`,
        405
      )
    }
    
    await handler(req, res, session)
  })
}

/**
 * 请求速率限制中间件
 * 限制API请求的频率
 * @param limit 时间窗口内允许的最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @param handler API处理函数
 * @returns 包装后的API处理函数
 */
export function withRateLimit(
  limit: number = 100,
  windowMs: number = 60 * 1000,
  handler: ApiHandler
): ApiHandler {
  // 使用内存存储请求记录
  // 在生产环境中，应该使用Redis等分布式存储
  const requestRecords: Record<string, { count: number; resetTime: number }> = {}
  
  return withEnhancedErrorHandler(async (req, res, session) => {
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
    const key = `${ip}:${req.url}`
    const now = Date.now()
    
    // 初始化或重置过期的记录
    if (!requestRecords[key] || requestRecords[key].resetTime < now) {
      requestRecords[key] = {
        count: 0,
        resetTime: now + windowMs,
      }
    }
    
    // 增加请求计数
    requestRecords[key].count++
    
    // 检查是否超过限制
    if (requestRecords[key].count > limit) {
      throw new ApiError(
        'RATE_LIMIT_ERROR',
        '请求频率过高，请稍后重试',
        429
      )
    }
    
    // 设置速率限制响应头
    res.setHeader('X-RateLimit-Limit', limit.toString())
    res.setHeader('X-RateLimit-Remaining', (limit - requestRecords[key].count).toString())
    res.setHeader('X-RateLimit-Reset', Math.ceil(requestRecords[key].resetTime / 1000).toString())
    
    await handler(req, res, session)
  })
}
