/**
 * 客户端API缓存工具
 * 用于减少重复的API请求，提高性能
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5分钟默认缓存时间

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 缓存时间（毫秒），默认5分钟
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 删除过期的缓存项
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 创建全局缓存实例
export const apiCache = new ApiCache()

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 60 * 1000) // 每分钟清理一次
}

/**
 * 缓存装饰器函数
 * 用于包装API调用，自动处理缓存
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = apiCache.get<T>(key)
  if (cached) {
    return Promise.resolve(cached)
  }

  // 缓存未命中，执行实际请求
  return fetcher().then(data => {
    // 缓存结果
    apiCache.set(key, data, ttl)
    return data
  })
}

/**
 * 生成缓存键的工具函数
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${prefix}:${sortedParams}`
}

/**
 * 预定义的缓存键前缀
 */
export const CACHE_KEYS = {
  USER_LIKES: 'user:likes',
  USER_FAVORITES: 'user:favorites',
  PAGE_DETAIL: 'page:detail',
  PAGE_COMMENTS: 'page:comments',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  RELATED_CONTENT: 'related:content',
} as const

/**
 * 预定义的缓存时间（毫秒）
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1分钟
  MEDIUM: 5 * 60 * 1000,     // 5分钟
  LONG: 15 * 60 * 1000,      // 15分钟
  VERY_LONG: 60 * 60 * 1000, // 1小时
} as const
