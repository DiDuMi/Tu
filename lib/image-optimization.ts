/**
 * 图片优化工具库
 * 提供图片压缩、格式转换、尺寸调整等功能
 */

export interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto'
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  blur?: number
  sharpen?: boolean
  progressive?: boolean
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  aspectRatio: number
}

/**
 * 生成优化的图片URL
 */
export function generateOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    quality = 75,
    format = 'auto',
    width,
    height,
    fit = 'cover',
    blur,
    sharpen = false,
    progressive = true
  } = options

  // 如果是外部URL，直接返回
  if (originalUrl.startsWith('http') && (typeof window === 'undefined' || !originalUrl.includes(window.location.origin))) {
    return originalUrl
  }

  // 构建查询参数
  const params = new URLSearchParams()

  if (quality !== 75) params.set('q', quality.toString())
  if (format !== 'auto') params.set('f', format)
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  if (fit !== 'cover') params.set('fit', fit)
  if (blur) params.set('blur', blur.toString())
  if (sharpen) params.set('sharpen', '1')
  if (!progressive) params.set('progressive', '0')

  // 添加自动格式检测
  params.set('auto', 'format,compress')

  const queryString = params.toString()
  const separator = originalUrl.includes('?') ? '&' : '?'

  return queryString ? `${originalUrl}${separator}${queryString}` : originalUrl
}

/**
 * 根据设备和网络条件选择最佳图片质量
 */
export function getOptimalQuality(): number {
  if (typeof window === 'undefined') return 75

  // 检测网络连接
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

  if (connection) {
    const { effectiveType, downlink } = connection

    // 根据网络速度调整质量
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 50 // 低质量，快速加载
    } else if (effectiveType === '3g' || downlink < 1.5) {
      return 65 // 中等质量
    } else if (effectiveType === '4g' || downlink > 10) {
      return 85 // 高质量
    }
  }

  // 检测设备像素比
  const devicePixelRatio = window.devicePixelRatio || 1
  if (devicePixelRatio > 2) {
    return 80 // 高分辨率设备
  }

  return 75 // 默认质量
}

/**
 * 生成响应式图片的sizes属性
 */
export function generateResponsiveSizes(
  breakpoints: { [key: string]: string } = {}
): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(max-width: 1280px)': '33vw',
    ...breakpoints
  }

  const sizes = Object.entries(defaultBreakpoints)
    .map(([query, size]) => `${query} ${size}`)
    .join(', ')

  return `${sizes}, 25vw`
}

/**
 * 检测浏览器支持的图片格式
 */
export function getSupportedImageFormats(): string[] {
  if (typeof window === 'undefined') return ['jpeg', 'png', 'webp']

  const formats: string[] = ['jpeg', 'png']

  // 检测WebP支持
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  if (webpSupported) formats.push('webp')

  // 检测AVIF支持
  const avifSupported = new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => resolve(avif.height === 2)
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })

  // 暂时假设现代浏览器支持AVIF
  if ('createImageBitmap' in window) {
    formats.push('avif')
  }

  return formats
}

/**
 * 计算图片的最佳尺寸
 */
export function calculateOptimalDimensions(
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
 * 生成图片的模糊占位符
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#f3f4f6'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="${color}" filter="url(#blur)"/>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * 预加载关键图片
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const optimizedSrc = generateOptimizedImageUrl(src, options)

    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`))
    img.src = optimizedSrc
  })
}

/**
 * 批量预加载图片
 */
export async function preloadImages(
  sources: string[],
  options: ImageOptimizationOptions = {},
  maxConcurrent: number = 3
): Promise<void> {
  const chunks = []
  for (let i = 0; i < sources.length; i += maxConcurrent) {
    chunks.push(sources.slice(i, i + maxConcurrent))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(src => preloadImage(src, options))
    )
  }
}

/**
 * 图片性能监控
 */
export class ImagePerformanceMonitor {
  private static instance: ImagePerformanceMonitor
  private metrics: Map<string, any> = new Map()

  static getInstance(): ImagePerformanceMonitor {
    if (!ImagePerformanceMonitor.instance) {
      ImagePerformanceMonitor.instance = new ImagePerformanceMonitor()
    }
    return ImagePerformanceMonitor.instance
  }

  recordLoadTime(src: string, loadTime: number): void {
    this.metrics.set(src, {
      loadTime,
      timestamp: Date.now()
    })
  }

  getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values()).map(m => m.loadTime)
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  getMetrics(): any {
    return {
      totalImages: this.metrics.size,
      averageLoadTime: this.getAverageLoadTime(),
      metrics: Array.from(this.metrics.entries())
    }
  }
}

export default {
  generateOptimizedImageUrl,
  getOptimalQuality,
  generateResponsiveSizes,
  getSupportedImageFormats,
  calculateOptimalDimensions,
  generateBlurPlaceholder,
  preloadImage,
  preloadImages,
  ImagePerformanceMonitor
}
