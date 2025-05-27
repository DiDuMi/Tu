/**
 * 视频错误处理工具
 * 统一处理视频加载失败、播放错误等情况
 */

export interface VideoErrorConfig {
  fallbackVideo?: string
  fallbackPoster?: string
  retryCount?: number
  retryDelay?: number
  onError?: (src: string, error: Error) => void
  enableLogging?: boolean
}

export const DEFAULT_VIDEO_CONFIG: VideoErrorConfig = {
  fallbackVideo: '/videos/placeholder.mp4',
  fallbackPoster: '/images/video-placeholder.svg',
  retryCount: 2,
  retryDelay: 1000,
  enableLogging: true,
  onError: (src, error) => {
    console.warn(`视频加载失败: ${src}`, error)
  }
}

export interface VideoErrorInfo {
  code: number
  message: string
  type: 'NETWORK_ERROR' | 'FORMAT_ERROR' | 'DECODE_ERROR' | 'SRC_NOT_SUPPORTED' | 'UNKNOWN'
  recoverable: boolean
  suggestion: string
}

/**
 * 解析视频错误信息
 */
export function parseVideoError(error: MediaError | Error): VideoErrorInfo {
  if (error instanceof MediaError) {
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return {
          code: error.code,
          message: '视频加载被中止',
          type: 'NETWORK_ERROR',
          recoverable: true,
          suggestion: '请检查网络连接并重试'
        }
      
      case MediaError.MEDIA_ERR_NETWORK:
        return {
          code: error.code,
          message: '网络错误导致视频加载失败',
          type: 'NETWORK_ERROR',
          recoverable: true,
          suggestion: '请检查网络连接并重试'
        }
      
      case MediaError.MEDIA_ERR_DECODE:
        return {
          code: error.code,
          message: '视频解码失败',
          type: 'DECODE_ERROR',
          recoverable: false,
          suggestion: '视频文件可能已损坏，请尝试其他格式'
        }
      
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return {
          code: error.code,
          message: '不支持的视频格式',
          type: 'SRC_NOT_SUPPORTED',
          recoverable: false,
          suggestion: '请使用支持的视频格式（MP4、WebM）'
        }
      
      default:
        return {
          code: error.code,
          message: '未知的媒体错误',
          type: 'UNKNOWN',
          recoverable: false,
          suggestion: '请联系技术支持'
        }
    }
  }

  return {
    code: 0,
    message: error.message || '未知错误',
    type: 'UNKNOWN',
    recoverable: true,
    suggestion: '请重试或联系技术支持'
  }
}

/**
 * 视频URL验证
 */
export function validateVideoUrl(src: string): boolean {
  if (!src) return false
  
  // 检查是否是有效的URL格式
  try {
    if (src.startsWith('/')) return true // 相对路径
    if (src.startsWith('blob:')) return true // Blob URL
    if (src.startsWith('data:')) return true // Data URL
    new URL(src) // 绝对URL验证
    return true
  } catch {
    return false
  }
}

/**
 * 获取安全的视频URL
 */
export function getSafeVideoUrl(src: string, fallback?: string): string {
  if (validateVideoUrl(src)) return src
  return fallback || DEFAULT_VIDEO_CONFIG.fallbackVideo || '/videos/placeholder.mp4'
}

/**
 * 获取安全的视频海报URL
 */
export function getSafeVideoPoster(poster: string | undefined, fallback?: string): string {
  if (poster && validateVideoUrl(poster)) return poster
  return fallback || DEFAULT_VIDEO_CONFIG.fallbackPoster || '/images/video-placeholder.svg'
}

/**
 * 视频预加载
 */
export function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error(`Failed to preload video: ${src}`))
    
    video.src = src
  })
}

/**
 * 批量视频预加载
 */
export async function preloadVideos(sources: string[]): Promise<void> {
  const validSources = sources.filter(validateVideoUrl)
  
  try {
    await Promise.allSettled(
      validSources.map(src => preloadVideo(src))
    )
  } catch (error) {
    console.warn('部分视频预加载失败', error)
  }
}

/**
 * 检测视频格式支持
 */
export function checkVideoFormatSupport(format: string): boolean {
  if (typeof window === 'undefined') return false
  
  const video = document.createElement('video')
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4; codecs="avc1.42E01E"',
    webm: 'video/webm; codecs="vp9"',
    ogg: 'video/ogg; codecs="theora"',
    av1: 'video/mp4; codecs="av01.0.05M.08"',
    h265: 'video/mp4; codecs="hev1.1.6.L93.B0"'
  }
  
  const mimeType = mimeTypes[format.toLowerCase()]
  return mimeType ? video.canPlayType(mimeType) !== '' : false
}

/**
 * 获取推荐的视频格式
 */
export function getRecommendedVideoFormat(): string {
  const formats = ['av1', 'webm', 'mp4']
  
  for (const format of formats) {
    if (checkVideoFormatSupport(format)) {
      return format
    }
  }
  
  return 'mp4' // 默认fallback
}

/**
 * 视频质量检测
 */
export function detectVideoQuality(
  width: number,
  height: number,
  bitrate?: number
): 'low' | 'medium' | 'high' | 'ultra' {
  const pixels = width * height
  
  if (pixels >= 3840 * 2160) return 'ultra' // 4K
  if (pixels >= 1920 * 1080) return 'high'  // 1080p
  if (pixels >= 1280 * 720) return 'medium' // 720p
  return 'low' // 480p及以下
}

/**
 * 生成视频错误报告
 */
export function generateVideoErrorReport(
  src: string,
  error: VideoErrorInfo,
  userAgent: string = navigator.userAgent,
  timestamp: number = Date.now()
): object {
  return {
    timestamp,
    src,
    error,
    userAgent,
    browserInfo: {
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    videoSupport: {
      mp4: checkVideoFormatSupport('mp4'),
      webm: checkVideoFormatSupport('webm'),
      av1: checkVideoFormatSupport('av1')
    }
  }
}

/**
 * 视频错误恢复策略
 */
export class VideoErrorRecovery {
  private retryAttempts: Map<string, number> = new Map()
  private config: VideoErrorConfig

  constructor(config: VideoErrorConfig = {}) {
    this.config = { ...DEFAULT_VIDEO_CONFIG, ...config }
  }

  async handleError(src: string, error: MediaError | Error): Promise<string | null> {
    const errorInfo = parseVideoError(error)
    const attempts = this.retryAttempts.get(src) || 0

    // 记录错误
    if (this.config.enableLogging) {
      console.error('视频错误:', generateVideoErrorReport(src, errorInfo))
    }

    // 调用错误回调
    this.config.onError?.(src, error instanceof Error ? error : new Error(errorInfo.message))

    // 如果错误不可恢复，直接返回fallback
    if (!errorInfo.recoverable) {
      return this.config.fallbackVideo || null
    }

    // 如果还有重试次数
    if (attempts < (this.config.retryCount || 0)) {
      this.retryAttempts.set(src, attempts + 1)
      
      // 延迟重试
      await new Promise(resolve => 
        setTimeout(resolve, this.config.retryDelay || 1000)
      )
      
      return src // 返回原始URL进行重试
    }

    // 重试次数用完，返回fallback
    return this.config.fallbackVideo || null
  }

  resetRetryCount(src: string): void {
    this.retryAttempts.delete(src)
  }

  getRetryCount(src: string): number {
    return this.retryAttempts.get(src) || 0
  }

  clearAllRetries(): void {
    this.retryAttempts.clear()
  }
}

/**
 * 视频性能监控
 */
export class VideoPerformanceTracker {
  private metrics: Map<string, any> = new Map()
  private startTimes: Map<string, number> = new Map()

  startTracking(src: string): void {
    this.startTimes.set(src, performance.now())
  }

  recordLoadTime(src: string): void {
    const startTime = this.startTimes.get(src)
    if (startTime) {
      const loadTime = performance.now() - startTime
      this.updateMetrics(src, { loadTime, success: true })
      this.startTimes.delete(src)
    }
  }

  recordError(src: string, error: string): void {
    const startTime = this.startTimes.get(src)
    const loadTime = startTime ? performance.now() - startTime : 0
    
    this.updateMetrics(src, { loadTime, success: false, error })
    this.startTimes.delete(src)
  }

  private updateMetrics(src: string, data: any): void {
    this.metrics.set(src, {
      ...data,
      timestamp: Date.now(),
      url: src
    })
  }

  getMetrics(): any {
    const allMetrics = Array.from(this.metrics.values())
    const successful = allMetrics.filter(m => m.success)
    
    return {
      total: allMetrics.length,
      successful: successful.length,
      failed: allMetrics.length - successful.length,
      successRate: allMetrics.length > 0 ? (successful.length / allMetrics.length) * 100 : 0,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((sum, m) => sum + m.loadTime, 0) / successful.length 
        : 0,
      metrics: allMetrics
    }
  }

  clear(): void {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

export default {
  parseVideoError,
  validateVideoUrl,
  getSafeVideoUrl,
  getSafeVideoPoster,
  preloadVideo,
  preloadVideos,
  checkVideoFormatSupport,
  getRecommendedVideoFormat,
  detectVideoQuality,
  generateVideoErrorReport,
  VideoErrorRecovery,
  VideoPerformanceTracker,
  DEFAULT_VIDEO_CONFIG
}
