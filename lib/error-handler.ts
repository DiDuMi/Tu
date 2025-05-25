import { toast } from '@/components/ui/Toast'
import { NextApiRequest, NextApiResponse } from 'next'
import { ZodError } from 'zod'
import { prisma } from './prisma'

/**
 * 错误类型
 */
export type ErrorType =
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'
  | 'DATABASE_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'BAD_REQUEST_ERROR'

/**
 * 错误信息
 */
export interface ErrorInfo {
  type: ErrorType
  message: string
  details?: any
  statusCode?: number
}

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  throwError?: boolean
  retryCount?: number
  retryDelay?: number
}

/**
 * 默认错误处理选项
 */
const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  throwError: false,
  retryCount: 0,
  retryDelay: 1000,
}

/**
 * 处理API错误
 * @param error 错误对象
 * @param options 错误处理选项
 * @returns 错误信息
 */
export function handleApiError(error: any, options: ErrorHandlerOptions = {}): ErrorInfo {
  const opts = { ...defaultOptions, ...options }
  let errorInfo: ErrorInfo

  // 解析错误类型和信息
  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response
    const message = data?.message || data?.error?.message || '服务器响应错误'

    if (status === 401) {
      errorInfo = {
        type: 'AUTHENTICATION_ERROR',
        message: '未授权，请登录后重试',
        details: data,
        statusCode: status,
      }
    } else if (status === 403) {
      errorInfo = {
        type: 'AUTHORIZATION_ERROR',
        message: '没有权限执行此操作',
        details: data,
        statusCode: status,
      }
    } else if (status === 404) {
      errorInfo = {
        type: 'NOT_FOUND_ERROR',
        message: '请求的资源不存在',
        details: data,
        statusCode: status,
      }
    } else if (status === 422) {
      errorInfo = {
        type: 'VALIDATION_ERROR',
        message: '请求数据验证失败',
        details: data,
        statusCode: status,
      }
    } else if (status >= 500) {
      errorInfo = {
        type: 'SERVER_ERROR',
        message: '服务器内部错误，请稍后重试',
        details: data,
        statusCode: status,
      }
    } else {
      errorInfo = {
        type: 'API_ERROR',
        message,
        details: data,
        statusCode: status,
      }
    }
  } else if (error.request) {
    // 请求发送但没有收到响应
    errorInfo = {
      type: 'NETWORK_ERROR',
      message: '网络错误，请检查您的网络连接',
      details: error.request,
    }
  } else {
    // 请求设置时出错
    errorInfo = {
      type: 'UNKNOWN_ERROR',
      message: error.message || '发生未知错误',
      details: error,
    }
  }

  // 显示错误提示
  if (opts.showToast) {
    toast({
      title: getErrorTitle(errorInfo.type),
      description: errorInfo.message,
      variant: 'destructive',
    })
  }

  // 记录错误日志
  if (opts.logToConsole) {
    console.error(`[${errorInfo.type}] ${errorInfo.message}`, errorInfo.details)
  }

  // 抛出错误
  if (opts.throwError) {
    throw new Error(`[${errorInfo.type}] ${errorInfo.message}`)
  }

  return errorInfo
}

/**
 * 获取错误类型对应的标题
 * @param type 错误类型
 * @returns 错误标题
 */
function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case 'API_ERROR':
      return 'API错误'
    case 'NETWORK_ERROR':
      return '网络错误'
    case 'VALIDATION_ERROR':
      return '数据验证错误'
    case 'AUTHENTICATION_ERROR':
      return '认证错误'
    case 'AUTHORIZATION_ERROR':
      return '授权错误'
    case 'NOT_FOUND_ERROR':
      return '资源不存在'
    case 'SERVER_ERROR':
      return '服务器错误'
    case 'DATABASE_ERROR':
      return '数据库错误'
    case 'CONFLICT_ERROR':
      return '数据冲突'
    case 'RATE_LIMIT_ERROR':
      return '请求频率限制'
    case 'BAD_REQUEST_ERROR':
      return '请求参数错误'
    case 'UNKNOWN_ERROR':
      return '未知错误'
    default:
      return '错误'
  }
}

/**
 * 自定义API错误类
 */
export class ApiError extends Error {
  type: ErrorType
  statusCode: number
  details?: any

  constructor(type: ErrorType, message: string, statusCode: number = 500, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * 记录错误日志到数据库
 * @param error 错误对象
 * @param req 请求对象
 * @param userId 用户ID
 */
export async function logErrorToDatabase(
  error: any,
  req: NextApiRequest,
  userId?: number
): Promise<void> {
  try {
    const errorInfo = error instanceof ApiError
      ? { type: error.type, details: error.details, statusCode: error.statusCode }
      : { type: 'UNKNOWN_ERROR', details: error.stack }

    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        module: req.url?.split('/').slice(-2, -1)[0]?.toUpperCase() || 'API',
        action: req.method || 'UNKNOWN',
        message: error.message,
        details: JSON.stringify({
          ...errorInfo,
          url: req.url,
          method: req.method,
          query: req.query,
          body: req.body,
        }),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId,
      },
    })
  } catch (logError) {
    console.error('Error logging failed:', logError)
    console.error('Original error:', error)
  }
}

/**
 * 处理Zod验证错误
 * @param error Zod错误对象
 * @returns API错误对象
 */
export function handleZodError(error: ZodError): ApiError {
  return new ApiError(
    'VALIDATION_ERROR',
    '数据验证失败',
    422,
    error.format()
  )
}

/**
 * 处理Prisma数据库错误
 * @param error Prisma错误对象
 * @returns API错误对象
 */
export function handlePrismaError(error: any): ApiError {
  // Prisma错误代码: https://www.prisma.io/docs/reference/api-reference/error-reference
  if (error.code === 'P2002') {
    return new ApiError(
      'CONFLICT_ERROR',
      '数据已存在',
      409,
      { fields: error.meta?.target }
    )
  } else if (error.code === 'P2025') {
    return new ApiError(
      'NOT_FOUND_ERROR',
      '记录未找到',
      404
    )
  } else if (error.code === 'P2003') {
    return new ApiError(
      'CONFLICT_ERROR',
      '外键约束失败',
      409,
      { fields: error.meta?.field_name }
    )
  } else {
    return new ApiError(
      'DATABASE_ERROR',
      '数据库操作失败',
      500,
      { code: error.code, message: error.message }
    )
  }
}
