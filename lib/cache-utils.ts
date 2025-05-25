/**
 * 缓存管理工具函数
 */

/**
 * 清除特定内容的所有相关缓存
 * @param contentId 内容ID（可以是数字ID或UUID）
 */
export async function clearContentCache(contentId: string | number): Promise<void> {
  if (typeof window === 'undefined') {
    return // 服务器端不执行
  }

  try {
    // 清除浏览器缓存
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      
      // 清除API缓存
      await cache.delete(`/api/v1/pages/${contentId}`)
      
      // 清除页面缓存
      await cache.delete(`/pages/${contentId}`)
      
      // 清除可能的其他相关缓存
      await cache.delete(`/_next/data/*/pages/${contentId}.json`)
    }

    console.log(`已清除内容 ${contentId} 的缓存`)
  } catch (error) {
    console.warn('清除缓存失败:', error)
  }
}

/**
 * 清除所有内容列表相关的缓存
 */
export async function clearContentListCache(): Promise<void> {
  if (typeof window === 'undefined') {
    return // 服务器端不执行
  }

  try {
    const cacheNames = await caches.keys()
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      
      // 清除内容列表API缓存
      const keys = await cache.keys()
      for (const request of keys) {
        if (request.url.includes('/api/v1/pages') && request.url.includes('?')) {
          await cache.delete(request)
        }
      }
    }

    console.log('已清除内容列表缓存')
  } catch (error) {
    console.warn('清除内容列表缓存失败:', error)
  }
}

/**
 * 强制刷新SWR缓存
 * @param key SWR缓存键
 */
export function invalidateSWRCache(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    // 清除SWR的localStorage缓存
    const swrKeys = Object.keys(localStorage).filter(k => k.startsWith('swr-'))
    swrKeys.forEach(k => {
      if (k.includes(key)) {
        localStorage.removeItem(k)
      }
    })
  }
}

/**
 * 设置无缓存的请求头
 */
export function getNoCacheHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

/**
 * 为fetch请求添加缓存破坏参数
 * @param url 原始URL
 * @returns 带有缓存破坏参数的URL
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${Date.now()}`
}
