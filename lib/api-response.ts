/**
 * API响应工具
 * 提供统一的API响应格式
 */

import { NextApiResponse } from 'next'

/**
 * 成功响应接口
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * API响应类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

/**
 * 发送成功响应
 * @param res NextApiResponse对象
 * @param data 响应数据
 * @param message 成功消息
 * @param statusCode HTTP状态码
 */
export function sendSuccessResponse<T = any>(
  res: NextApiResponse,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  })
}

/**
 * 发送分页成功响应
 * @param res NextApiResponse对象
 * @param data 响应数据
 * @param total 总记录数
 * @param page 当前页码
 * @param limit 每页记录数
 * @param message 成功消息
 * @param statusCode HTTP状态码
 */
export function sendPaginatedResponse<T = any>(
  res: NextApiResponse,
  data: T,
  total: number,
  page: number,
  limit: number,
  message?: string,
  statusCode: number = 200
): void {
  const totalPages = Math.ceil(total / limit)
  
  res.status(statusCode).json({
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}

/**
 * 发送创建成功响应
 * @param res NextApiResponse对象
 * @param data 响应数据
 * @param message 成功消息
 */
export function sendCreatedResponse<T = any>(
  res: NextApiResponse,
  data: T,
  message: string = '创建成功'
): void {
  sendSuccessResponse(res, data, message, 201)
}

/**
 * 发送更新成功响应
 * @param res NextApiResponse对象
 * @param data 响应数据
 * @param message 成功消息
 */
export function sendUpdatedResponse<T = any>(
  res: NextApiResponse,
  data: T,
  message: string = '更新成功'
): void {
  sendSuccessResponse(res, data, message, 200)
}

/**
 * 发送删除成功响应
 * @param res NextApiResponse对象
 * @param message 成功消息
 */
export function sendDeletedResponse(
  res: NextApiResponse,
  message: string = '删除成功'
): void {
  sendSuccessResponse(res, null, message, 200)
}

/**
 * 发送错误响应
 * @param res NextApiResponse对象
 * @param code 错误代码
 * @param message 错误消息
 * @param details 错误详情
 * @param statusCode HTTP状态码
 */
export function sendErrorResponse(
  res: NextApiResponse,
  code: string,
  message: string,
  details?: any,
  statusCode: number = 400
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  })
}

/**
 * 发送验证错误响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 * @param details 错误详情
 */
export function sendValidationErrorResponse(
  res: NextApiResponse,
  message: string = '数据验证失败',
  details?: any
): void {
  sendErrorResponse(res, 'VALIDATION_ERROR', message, details, 422)
}

/**
 * 发送认证错误响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function sendAuthenticationErrorResponse(
  res: NextApiResponse,
  message: string = '未认证，请登录后重试'
): void {
  sendErrorResponse(res, 'AUTHENTICATION_ERROR', message, undefined, 401)
}

/**
 * 发送授权错误响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function sendAuthorizationErrorResponse(
  res: NextApiResponse,
  message: string = '没有权限执行此操作'
): void {
  sendErrorResponse(res, 'AUTHORIZATION_ERROR', message, undefined, 403)
}

/**
 * 发送未找到错误响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function sendNotFoundErrorResponse(
  res: NextApiResponse,
  message: string = '请求的资源不存在'
): void {
  sendErrorResponse(res, 'NOT_FOUND_ERROR', message, undefined, 404)
}

/**
 * 发送服务器错误响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 * @param details 错误详情
 */
export function sendServerErrorResponse(
  res: NextApiResponse,
  message: string = '服务器内部错误',
  details?: any
): void {
  sendErrorResponse(res, 'SERVER_ERROR', message, details, 500)
}
