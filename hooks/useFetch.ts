import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import { useState } from 'react'
import { ApiResponse } from '@/types/api'

const defaultFetcher = async (url: string) => {
  console.log(`[useFetch] 请求URL: ${url}`)

  try {
    const response = await fetch(url, {
      credentials: 'include', // 确保包含cookies，对于认证很重要
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`[useFetch] 响应状态: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`[useFetch] 请求失败:`, { url, status: response.status, errorData })

      const error = new Error(errorData.error?.message || '请求失败')
      ;(error as any).status = response.status
      ;(error as any).info = errorData
      throw error
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`[useFetch] 请求异常:`, { url, error })
    throw error
  }
}

export function useFetch<T>(
  url: string | null,
  config?: SWRConfiguration
): SWRResponse<ApiResponse<T>, Error> & { isLoading: boolean } {
  const { data, error, mutate, isValidating, isLoading: swrIsLoading, ...rest } = useSWR<ApiResponse<T>, Error>(
    url,
    defaultFetcher,
    config
  )

  const isLoading = (!error && !data) || isValidating

  return {
    data,
    error,
    mutate,
    isValidating,
    isLoading,
    ...rest,
  }
}

interface MutationOptions<T> {
  onSuccess?: (data: ApiResponse<T>) => void
  onError?: (error: Error) => void
}

export function useMutation<T, D = any>(url: string) {
  const [data, setData] = useState<ApiResponse<T> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const mutate = async (
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload?: D,
    options?: MutationOptions<T>
  ) => {
    try {
      setLoading(true)
      setError(null)

      console.log(`[useMutation] 请求: ${method} ${url}`, payload ? { payload } : '')

      const response = await fetch(url, {
        method,
        credentials: 'include', // 确保包含cookies，对于认证很重要
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('API请求失败:', {
          status: response.status,
          url,
          method,
          responseData
        })
        const error = new Error(responseData.error?.message || '请求失败')
        ;(error as any).status = response.status
        ;(error as any).info = responseData
        throw error
      }

      setData(responseData)
      options?.onSuccess?.(responseData)
      return responseData
    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误')
      setError(error)
      options?.onError?.(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    error,
    loading,
    post: (payload?: D, options?: MutationOptions<T>) => mutate('POST', payload, options),
    put: (payload?: D, options?: MutationOptions<T>) => mutate('PUT', payload, options),
    patch: (payload?: D, options?: MutationOptions<T>) => mutate('PATCH', payload, options),
    delete: (payload?: D, options?: MutationOptions<T>) => mutate('DELETE', payload, options),
  }
}
