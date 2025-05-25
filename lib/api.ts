import { NextApiResponse } from 'next'

/**
 * 成功响应
 * @param res NextApiResponse对象
 * @param data 响应数据
 * @param message 可选的成功消息
 * @param status HTTP状态码，默认200
 * @param pagination 可选的分页信息
 */
export function successResponse(
  res: NextApiResponse,
  data: any,
  message?: string,
  status: number = 200,
  pagination?: any
) {
  // 构建响应对象
  const responseBody: any = {
    success: true,
    data
  }

  // 添加可选字段
  if (message) responseBody.message = message
  if (pagination) responseBody.pagination = pagination

  // 处理BigInt序列化问题
  const safeResponseBody = JSON.parse(JSON.stringify(responseBody, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))

  // 返回响应
  return res.status(status).json(safeResponseBody)
}

/**
 * 错误响应
 * @param res NextApiResponse对象
 * @param code 错误代码
 * @param message 错误消息
 * @param details 可选的错误详情
 * @param status HTTP状态码，默认400
 */
export function errorResponse(
  res: NextApiResponse,
  code: string,
  message: string,
  details?: any,
  status: number = 400
) {
  // 构建错误响应对象
  const errorBody = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }

  // 处理BigInt序列化问题
  const safeErrorBody = JSON.parse(JSON.stringify(errorBody, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))

  return res.status(status).json(safeErrorBody)
}

/**
 * 分页数据响应
 * @param res NextApiResponse对象
 * @param items 数据项数组
 * @param total 总数据条数
 * @param page 当前页码
 * @param limit 每页条数
 */
export function paginatedResponse(
  res: NextApiResponse,
  items: any[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit)

  return successResponse(res, {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    }
  })
}

/**
 * 验证错误响应
 * @param res NextApiResponse对象
 * @param errors 验证错误对象
 */
export function validationErrorResponse(
  res: NextApiResponse,
  errors: Record<string, string>
) {
  return errorResponse(
    res,
    'VALIDATION_ERROR',
    '请求数据验证失败',
    errors,
    422
  )
}

/**
 * 未授权响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function unauthorizedResponse(
  res: NextApiResponse,
  message: string = '未授权访问'
) {
  return errorResponse(
    res,
    'AUTH_UNAUTHORIZED',
    message,
    undefined,
    401
  )
}

/**
 * 禁止访问响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function forbiddenResponse(
  res: NextApiResponse,
  message: string = '权限不足'
) {
  return errorResponse(
    res,
    'AUTH_INSUFFICIENT_PERMISSIONS',
    message,
    undefined,
    403
  )
}

/**
 * 资源不存在响应
 * @param res NextApiResponse对象
 * @param message 错误消息
 */
export function notFoundResponse(
  res: NextApiResponse,
  message: string = '请求的资源不存在'
) {
  return errorResponse(
    res,
    'RESOURCE_NOT_FOUND',
    message,
    undefined,
    404
  )
}

/**
 * 通用数据获取函数，用于SWR
 * @param url 请求URL
 * @returns 响应数据
 */
export const fetcher = async (url: string) => {
  console.log(`[Fetcher] 请求URL: ${url}`)

  try {
    const response = await fetch(url)
    console.log(`[Fetcher] 响应状态: ${response.status}`)

    if (!response.ok) {
      const error = new Error('API请求失败')
      const errorData = await response.json().catch(() => ({}))
      ;(error as any).status = response.status
      ;(error as any).info = errorData
      console.error(`[Fetcher] 请求失败: ${url}`, error)
      throw error
    }

    const data = await response.json()
    console.log(`[Fetcher] 响应数据类型: ${typeof data}`, {
      success: data.success,
      hasData: data.data ? true : false,
      dataType: data.data ? typeof data.data : null,
      isDataArray: data.data ? Array.isArray(data.data) : false,
      hasItems: data.data?.items ? true : false,
      isItemsArray: data.data?.items ? Array.isArray(data.data.items) : false,
    })

    return data
  } catch (error) {
    console.error(`[Fetcher] 请求异常: ${url}`, error)
    throw error
  }
}
