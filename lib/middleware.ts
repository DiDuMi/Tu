import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { unauthorizedResponse, forbiddenResponse } from './api'
import { UserRole } from '@/types/enums'

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
type NextApiHandlerWithUser = (req: NextApiRequest, res: NextApiResponse, user: any) => Promise<void> | void

/**
 * 身份验证中间件
 * 确保请求来自已认证的用户
 */
export function withAuth(handler: NextApiHandler): NextApiHandler
export function withAuth(handler: NextApiHandlerWithUser): NextApiHandler
export function withAuth(handler: NextApiHandler | NextApiHandlerWithUser): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions)
      console.log(`[Auth中间件] 会话状态:`, session ? '已认证' : '未认证')

      if (!session) {
        console.log(`[Auth中间件] 未认证访问: ${req.method} ${req.url}`)
        return unauthorizedResponse(res)
      }

      // 将会话信息添加到请求对象中，方便后续使用
      ;(req as any).session = session

      // 检查处理程序是否需要用户参数
      if (handler.length === 3) {
        return (handler as NextApiHandlerWithUser)(req, res, session.user)
      } else {
        return (handler as NextApiHandler)(req, res)
      }
    } catch (error) {
      console.error(`[Auth中间件] 错误:`, error)
      return unauthorizedResponse(res, '认证过程中发生错误')
    }
  }
}

/**
 * 角色验证中间件
 * 确保请求来自具有特定角色的用户
 * @param roles 允许的角色数组
 */
export function withRole(roles: UserRole[], handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions)
      console.log(`[Role中间件] 会话状态:`, session ? '已认证' : '未认证')

      if (!session) {
        console.log(`[Role中间件] 未认证访问: ${req.method} ${req.url}`)
        return unauthorizedResponse(res)
      }

      const userRole = session.user.role as UserRole
      console.log(`[Role中间件] 用户角色: ${userRole}, 需要角色: ${roles.join(', ')}`)

      if (!roles.includes(userRole)) {
        console.log(`[Role中间件] 权限不足: ${req.method} ${req.url}`)
        return forbiddenResponse(res, '您没有执行此操作的权限')
      }

      // 将会话信息添加到请求对象中，方便后续使用
      ;(req as any).session = session

      return handler(req, res)
    } catch (error) {
      console.error(`[Role中间件] 错误:`, error)
      return unauthorizedResponse(res, '认证过程中发生错误')
    }
  }
}

/**
 * 管理员验证中间件
 * 确保请求来自管理员用户
 */
export function withAdmin(handler: NextApiHandler): NextApiHandler {
  return withRole([UserRole.ADMIN], handler)
}

/**
 * 操作员验证中间件
 * 确保请求来自操作员或管理员用户
 */
export function withOperator(handler: NextApiHandler): NextApiHandler {
  return withRole([UserRole.OPERATOR, UserRole.ADMIN], handler)
}

/**
 * 错误处理中间件
 * 捕获处理程序中的错误并返回适当的响应
 */
export function withErrorHandler(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      console.log(`[API] 请求: ${req.method} ${req.url}`)
      return await handler(req, res)
    } catch (error) {
      console.error(`[API] 错误: ${req.method} ${req.url}`, error)

      // 如果响应已经发送，不做任何处理
      if (res.headersSent) {
        return
      }

      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // 在开发环境中返回更详细的错误信息
      const isDev = process.env.NODE_ENV !== 'production';

      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: isDev ? errorMessage : '服务器内部错误',
          ...(isDev && errorStack && { stack: errorStack }),
        },
      })
    }
  }
}
