import { handleApiError } from './error-handler'
import { toast } from '@/components/ui/Toast'

interface FetchOptions extends RequestInit {
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  retryCount?: number
  retryDelay?: number
}

/**
 * 发送API请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns 响应数据
 */
export async function fetchApi<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    retryCount = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  // 设置默认请求头
  const headers = new Headers(fetchOptions.headers)
  if (!headers.has('Content-Type') && !fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  // 构建请求选项
  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
  }

  // 发送请求
  try {
    const response = await fetchWithRetry(url, requestOptions, retryCount, retryDelay)

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        },
      }
    }

    // 解析响应数据
    const data = await response.json()

    // 显示成功提示
    if (showSuccessToast && successMessage) {
      toast({
        title: '操作成功',
        description: successMessage,
        variant: 'success',
      })
    }

    return data
  } catch (error) {
    // 处理错误
    handleApiError(error, {
      showToast: showErrorToast,
      logToConsole: true,
      throwError: true,
    })

    // 这里不会执行，因为handleApiError会抛出错误
    throw error
  }
}

/**
 * 带重试的fetch请求
 * @param url 请求URL
 * @param options 请求选项
 * @param retryCount 重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns 响应对象
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryCount: number,
  retryDelay: number
): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (retryCount <= 0) {
      throw error
    }

    // 等待指定时间后重试
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    // 递归重试
    return fetchWithRetry(url, options, retryCount - 1, retryDelay)
  }
}

/**
 * 发送GET请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns 响应数据
 */
export function get<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  return fetchApi<T>(url, {
    method: 'GET',
    ...options,
  })
}

/**
 * 发送POST请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns 响应数据
 */
export function post<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
  return fetchApi<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * 发送PUT请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns 响应数据
 */
export function put<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
  return fetchApi<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * 发送PATCH请求
 * @param url 请求URL
 * @param data 请求数据
 * @param options 请求选项
 * @returns 响应数据
 */
export function patch<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
  return fetchApi<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * 发送DELETE请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns 响应数据
 */
export function del<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  return fetchApi<T>(url, {
    method: 'DELETE',
    ...options,
  })
}
