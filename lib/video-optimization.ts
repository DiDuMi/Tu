/**
 * 视频优化工具库
 * 提供视频压缩、格式转换、质量优化等功能
 */

export interface VideoOptimizationOptions {
  quality?: 'low' | 'medium' | 'high' | 'auto'
  format?: 'mp4' | 'webm' | 'av1' | 'auto'
  width?: number
  height?: number
  bitrate?: string
  fps?: number
  codec?: 'h264' | 'h265' | 'vp9' | 'av1'
  audioCodec?: 'aac' | 'opus' | 'mp3'
  audioBitrate?: string
  fastStart?: boolean
  generateThumbnail?: boolean
  thumbnailTime?: number
}

export interface VideoMetadata {
  width: number
  height: number
  duration: number
  format: string
  codec: string
  bitrate: number
  fps: number
  size: number
  aspectRatio: number
}

export interface VideoFormatSupport {
  mp4: boolean
  webm: boolean
  av1: boolean
  hls: boolean
  dash: boolean
}

/**
 * 检测浏览器支持的视频格式
 */
export function detectVideoFormatSupport(): VideoFormatSupport {
  if (typeof window === 'undefined') {
    return { mp4: true, webm: false, av1: false, hls: false, dash: false }
  }

  const video = document.createElement('video')
  
  return {
    mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
    webm: video.canPlayType('video/webm; codecs="vp9"') !== '',
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '',
    hls: video.canPlayType('application/vnd.apple.mpegurl') !== '',
    dash: video.canPlayType('application/dash+xml') !== ''
  }
}

/**
 * 根据网络和设备条件选择最佳视频质量
 */
export function getOptimalVideoQuality(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'medium'

  // 检测网络连接
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (connection) {
    const { effectiveType, downlink, saveData } = connection
    
    // 如果用户启用了数据节省模式
    if (saveData) return 'low'
    
    // 根据网络速度调整质量
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'low'
    } else if (effectiveType === '3g' || downlink < 2) {
      return 'medium'
    } else if (effectiveType === '4g' || downlink > 5) {
      return 'high'
    }
  }

  // 检测设备性能
  const deviceMemory = (navigator as any).deviceMemory
  if (deviceMemory && deviceMemory < 4) {
    return 'medium'
  }

  // 检测设备像素比
  const devicePixelRatio = window.devicePixelRatio || 1
  if (devicePixelRatio > 2) {
    return 'high'
  }

  return 'medium'
}

/**
 * 生成优化的视频URL
 */
export function generateOptimizedVideoUrl(
  originalUrl: string,
  options: VideoOptimizationOptions = {}
): string {
  const {
    quality = 'auto',
    format = 'auto',
    width,
    height,
    bitrate,
    fps,
    codec,
    audioCodec,
    audioBitrate,
    fastStart = true,
    generateThumbnail = false,
    thumbnailTime = 1
  } = options

  // 如果是外部URL，直接返回
  if (originalUrl.startsWith('http') && (typeof window === 'undefined' || !originalUrl.includes(window.location.origin))) {
    return originalUrl
  }

  // 构建查询参数
  const params = new URLSearchParams()
  
  // 质量参数
  if (quality !== 'auto') {
    const qualityMap = { low: 28, medium: 23, high: 18 }
    params.set('crf', qualityMap[quality].toString())
  } else {
    const optimalQuality = getOptimalVideoQuality()
    const qualityMap = { low: 28, medium: 23, high: 18 }
    params.set('crf', qualityMap[optimalQuality].toString())
  }

  // 格式参数
  if (format !== 'auto') {
    params.set('format', format)
  } else {
    const formatSupport = detectVideoFormatSupport()
    if (formatSupport.av1 && quality === 'high') {
      params.set('format', 'av1')
    } else if (formatSupport.webm) {
      params.set('format', 'webm')
    } else {
      params.set('format', 'mp4')
    }
  }

  // 尺寸参数
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  
  // 编码参数
  if (codec) params.set('codec', codec)
  if (audioCodec) params.set('acodec', audioCodec)
  if (bitrate) params.set('vb', bitrate)
  if (audioBitrate) params.set('ab', audioBitrate)
  if (fps) params.set('fps', fps.toString())
  
  // 优化参数
  if (fastStart) params.set('faststart', '1')
  if (generateThumbnail) {
    params.set('thumbnail', '1')
    params.set('thumb_time', thumbnailTime.toString())
  }

  // 添加自动优化标识
  params.set('auto', 'optimize')

  const queryString = params.toString()
  const separator = originalUrl.includes('?') ? '&' : '?'
  
  return queryString ? `${originalUrl}${separator}${queryString}` : originalUrl
}

/**
 * 计算视频的最佳尺寸
 */
export function calculateOptimalVideoDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  if (maxWidth && maxHeight) {
    if (maintainAspectRatio) {
      const widthRatio = maxWidth / originalWidth
      const heightRatio = maxHeight / originalHeight
      const ratio = Math.min(widthRatio, heightRatio)
      
      return {
        width: Math.round(originalWidth * ratio),
        height: Math.round(originalHeight * ratio)
      }
    } else {
      return { width: maxWidth, height: maxHeight }
    }
  }

  if (maxWidth) {
    return {
      width: maxWidth,
      height: maintainAspectRatio ? Math.round(maxWidth / aspectRatio) : originalHeight
    }
  }

  if (maxHeight) {
    return {
      width: maintainAspectRatio ? Math.round(maxHeight * aspectRatio) : originalWidth,
      height: maxHeight
    }
  }

  return { width: originalWidth, height: originalHeight }
}

/**
 * 生成视频缩略图URL
 */
export function generateVideoThumbnail(
  videoUrl: string,
  time: number = 1,
  width: number = 320,
  height: number = 180
): string {
  const params = new URLSearchParams()
  params.set('thumbnail', '1')
  params.set('time', time.toString())
  params.set('w', width.toString())
  params.set('h', height.toString())

  const separator = videoUrl.includes('?') ? '&' : '?'
  return `${videoUrl}${separator}${params.toString()}`
}

/**
 * 预加载视频元数据
 */
export function preloadVideoMetadata(src: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        format: src.split('.').pop() || 'unknown',
        codec: 'unknown', // 需要更复杂的检测
        bitrate: 0, // 需要额外的API
        fps: 0, // 需要额外的API
        size: 0, // 需要额外的API
        aspectRatio: video.videoWidth / video.videoHeight
      })
    }
    
    video.onerror = () => {
      reject(new Error(`Failed to load video metadata: ${src}`))
    }
    
    video.src = src
  })
}

/**
 * 批量预加载视频
 */
export async function preloadVideos(
  sources: string[],
  options: VideoOptimizationOptions = {},
  maxConcurrent: number = 2
): Promise<void> {
  const chunks = []
  for (let i = 0; i < sources.length; i += maxConcurrent) {
    chunks.push(sources.slice(i, i + maxConcurrent))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(src => preloadVideoMetadata(generateOptimizedVideoUrl(src, options)))
    )
  }
}

/**
 * 视频性能监控类
 */
export class VideoPerformanceMonitor {
  private static instance: VideoPerformanceMonitor
  private metrics: Map<string, any> = new Map()
  private startTimes: Map<string, number> = new Map()

  static getInstance(): VideoPerformanceMonitor {
    if (!VideoPerformanceMonitor.instance) {
      VideoPerformanceMonitor.instance = new VideoPerformanceMonitor()
    }
    return VideoPerformanceMonitor.instance
  }

  startTiming(src: string): void {
    this.startTimes.set(src, performance.now())
  }

  recordLoadComplete(src: string): void {
    const startTime = this.startTimes.get(src)
    if (startTime) {
      const loadTime = performance.now() - startTime
      this.metrics.set(src, {
        loadTime,
        timestamp: Date.now(),
        success: true
      })
      this.startTimes.delete(src)
    }
  }

  recordError(src: string, error: string): void {
    const startTime = this.startTimes.get(src)
    const loadTime = startTime ? performance.now() - startTime : 0
    
    this.metrics.set(src, {
      loadTime,
      timestamp: Date.now(),
      success: false,
      error
    })
    
    if (startTime) {
      this.startTimes.delete(src)
    }
  }

  getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values())
      .filter(m => m.success)
      .map(m => m.loadTime)
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  getSuccessRate(): number {
    const total = this.metrics.size
    const successful = Array.from(this.metrics.values()).filter(m => m.success).length
    return total > 0 ? (successful / total) * 100 : 0
  }

  getMetrics(): any {
    return {
      totalVideos: this.metrics.size,
      averageLoadTime: this.getAverageLoadTime(),
      successRate: this.getSuccessRate(),
      metrics: Array.from(this.metrics.entries())
    }
  }

  clear(): void {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

/**
 * 视频格式转换建议
 */
export function getVideoFormatRecommendation(
  originalFormat: string,
  targetUse: 'web' | 'mobile' | 'streaming' | 'download'
): { format: string; codec: string; quality: string; reason: string } {
  const formatSupport = detectVideoFormatSupport()
  
  switch (targetUse) {
    case 'web':
      if (formatSupport.av1) {
        return { format: 'mp4', codec: 'av1', quality: 'high', reason: 'AV1提供最佳压缩效率' }
      } else if (formatSupport.webm) {
        return { format: 'webm', codec: 'vp9', quality: 'high', reason: 'WebM/VP9提供良好的压缩和质量' }
      } else {
        return { format: 'mp4', codec: 'h264', quality: 'medium', reason: 'H.264具有最佳兼容性' }
      }
    
    case 'mobile':
      return { format: 'mp4', codec: 'h264', quality: 'medium', reason: '移动设备优化，平衡质量和文件大小' }
    
    case 'streaming':
      return { format: 'mp4', codec: 'h264', quality: 'high', reason: '流媒体优化，支持自适应比特率' }
    
    case 'download':
      return { format: 'mp4', codec: 'h265', quality: 'high', reason: '下载优化，高质量小文件' }
    
    default:
      return { format: 'mp4', codec: 'h264', quality: 'medium', reason: '通用兼容性' }
  }
}

export default {
  detectVideoFormatSupport,
  getOptimalVideoQuality,
  generateOptimizedVideoUrl,
  calculateOptimalVideoDimensions,
  generateVideoThumbnail,
  preloadVideoMetadata,
  preloadVideos,
  VideoPerformanceMonitor,
  getVideoFormatRecommendation
}
