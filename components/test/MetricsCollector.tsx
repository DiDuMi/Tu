// 性能指标收集工具类

export class MetricsCollector {
  private observers: PerformanceObserver[] = []
  private mutationObserver: MutationObserver | null = null

  // 初始化性能观察器
  initializePerformanceObserver(callback: (entries: PerformanceEntry[]) => void) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries())
    })

    try {
      observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift'] 
      })
      this.observers.push(observer)
    } catch (e) {
      console.warn('某些性能指标不被支持:', e)
    }
  }

  // 初始化图片监控
  initializeImageObserver(callback: (images: HTMLImageElement[]) => void) {
    if (typeof window === 'undefined' || !('MutationObserver' in window)) {
      return
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      const newImages: HTMLImageElement[] = []

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            const images = element.tagName === 'IMG' 
              ? [element as HTMLImageElement]
              : Array.from(element.querySelectorAll('img'))
            
            newImages.push(...images)
          }
        })
      })

      if (newImages.length > 0) {
        callback(newImages)
      }
    })
    
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // 处理图片加载事件
  handleImageLoad(
    img: HTMLImageElement,
    onLoad: (imageId: string, loadTime: number) => void,
    onError: () => void
  ) {
    const startTime = Date.now()
    
    const handleLoad = () => {
      const loadTime = Date.now() - startTime
      const imageId = img.src.split('/').pop()?.split('?')[0] || 'unknown'
      onLoad(imageId, loadTime)
    }
    
    if (img.complete) {
      if (img.naturalWidth > 0) {
        handleLoad()
      } else {
        onError()
      }
    } else {
      img.addEventListener('load', handleLoad, { once: true })
      img.addEventListener('error', onError, { once: true })
    }
  }

  // 处理性能条目
  processPerformanceEntry(entry: PerformanceEntry) {
    const result: any = {}

    // 处理导航指标
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      result.ttfb = navEntry.responseStart - navEntry.requestStart
    }
    
    // 处理资源指标
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming
      result.resourceCount = 1
      result.transferSize = resourceEntry.transferSize || 0
      
      // 图片资源特殊处理
      if (resourceEntry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i)) {
        const imageId = resourceEntry.name.split('/').pop()?.split('?')[0] || 'unknown'
        const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart
        result.imageLoad = {
          imageId,
          loadTime,
          success: resourceEntry.responseEnd > 0
        }
      }
    }
    
    // 处理绘制指标
    if (entry.entryType === 'paint') {
      if (entry.name === 'first-contentful-paint') {
        result.fcp = entry.startTime
      }
    }
    
    // 处理LCP
    if (entry.entryType === 'largest-contentful-paint') {
      result.lcp = entry.startTime
    }
    
    // 处理布局偏移
    if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
      result.cls = (entry as any).value
    }

    return result
  }

  // 清理所有观察器
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  }
}

// 工具函数
export const formatMetricTime = (time?: number) => {
  if (!time) return 'N/A'
  return `${time.toFixed(0)}ms`
}

export const formatMetricSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const calculatePerformanceScore = (metrics: {
  lcp?: number
  fcp?: number
  cls?: number
  totalImages: number
  failedImages: number
}) => {
  let score = 100
  
  // LCP评分 (理想 < 2.5s)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 30
    else if (metrics.lcp > 2500) score -= 15
  }
  
  // FCP评分 (理想 < 1.8s)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 20
    else if (metrics.fcp > 1800) score -= 10
  }
  
  // CLS评分 (理想 < 0.1)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25
    else if (metrics.cls > 0.1) score -= 10
  }
  
  // 图片加载失败率
  if (metrics.totalImages > 0) {
    const failureRate = metrics.failedImages / metrics.totalImages
    if (failureRate > 0.1) score -= 15
    else if (failureRate > 0.05) score -= 5
  }
  
  return Math.max(0, score)
}
