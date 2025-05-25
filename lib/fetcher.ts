/**
 * 通用数据获取工具
 * 用于SWR库的fetcher函数
 */

// 默认的fetcher函数，用于处理JSON响应
export const fetcher = async (url: string) => {
  const response = await fetch(url)
  
  // 如果响应不成功，抛出错误
  if (!response.ok) {
    const error: any = new Error('API请求失败')
    
    // 尝试解析错误响应
    try {
      const errorData = await response.json()
      error.info = errorData
      error.status = response.status
    } catch (e) {
      error.info = { message: '无法解析错误响应' }
      error.status = response.status
    }
    
    throw error
  }
  
  return response.json()
}

// 带认证的fetcher函数
export const authFetcher = async (url: string, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    const error: any = new Error('API请求失败')
    
    try {
      const errorData = await response.json()
      error.info = errorData
      error.status = response.status
    } catch (e) {
      error.info = { message: '无法解析错误响应' }
      error.status = response.status
    }
    
    throw error
  }
  
  return response.json()
}

// POST请求fetcher
export const postFetcher = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error: any = new Error('API请求失败')
    
    try {
      const errorData = await response.json()
      error.info = errorData
      error.status = response.status
    } catch (e) {
      error.info = { message: '无法解析错误响应' }
      error.status = response.status
    }
    
    throw error
  }
  
  return response.json()
}

// PUT请求fetcher
export const putFetcher = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error: any = new Error('API请求失败')
    
    try {
      const errorData = await response.json()
      error.info = errorData
      error.status = response.status
    } catch (e) {
      error.info = { message: '无法解析错误响应' }
      error.status = response.status
    }
    
    throw error
  }
  
  return response.json()
}

// DELETE请求fetcher
export const deleteFetcher = async (url: string) => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error: any = new Error('API请求失败')
    
    try {
      const errorData = await response.json()
      error.info = errorData
      error.status = response.status
    } catch (e) {
      error.info = { message: '无法解析错误响应' }
      error.status = response.status
    }
    
    throw error
  }
  
  return response.json()
}
