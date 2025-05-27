/**
 * 图片错误处理工具
 * 统一处理图片加载失败的情况
 */

export interface ImageErrorConfig {
  fallbackImage?: string
  retryCount?: number
  retryDelay?: number
  onError?: (src: string, error: Error) => void
}

export const DEFAULT_CONFIG: ImageErrorConfig = {
  fallbackImage: '/images/placeholder.svg',
  retryCount: 2,
  retryDelay: 1000,
  onError: (src, error) => {
    console.warn(`图片加载失败: ${src}`, error)
  }
}

/**
 * 图片URL验证
 */
export function validateImageUrl(src: string): boolean {
  if (!src) return false
  
  // 检查是否是有效的URL格式
  try {
    if (src.startsWith('/')) return true // 相对路径
    if (src.startsWith('data:')) return true // base64
    new URL(src) // 绝对URL验证
    return true
  } catch {
    return false
  }
}

/**
 * 获取安全的图片URL
 */
export function getSafeImageUrl(src: string, fallback?: string): string {
  if (validateImageUrl(src)) return src
  return fallback || DEFAULT_CONFIG.fallbackImage || '/images/placeholder.svg'
}

/**
 * 图片预加载
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`))
    img.src = src
  })
}

/**
 * 批量图片预加载
 */
export async function preloadImages(sources: string[]): Promise<void> {
  const validSources = sources.filter(validateImageUrl)
  
  try {
    await Promise.allSettled(
      validSources.map(src => preloadImage(src))
    )
  } catch (error) {
    console.warn('部分图片预加载失败', error)
  }
}

export default {
  validateImageUrl,
  getSafeImageUrl,
  preloadImage,
  preloadImages,
  DEFAULT_CONFIG
}