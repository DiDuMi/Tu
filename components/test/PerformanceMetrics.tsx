import { useEffect, useState, useRef } from 'react'

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  
  // 图片相关指标
  imageLoadTimes: Record<string, number>
  totalImages: number
  loadedImages: number
  failedImages: number
  
  // 网络指标
  totalTransferSize: number
  totalResourceCount: number
  
  // 时间戳
  startTime: number
  lastUpdate: number
}

interface PerformanceMetricsProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  trackImages?: boolean
  autoReset?: boolean
}

export default function PerformanceMetrics({ 
  onMetricsUpdate, 
  trackImages = true,
  autoReset = false 
}: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    imageLoadTimes: {},
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    totalTransferSize: 0,
    totalResourceCount: 0,
    startTime: Date.now(),
    lastUpdate: Date.now()
  })

  const observerRef = useRef<PerformanceObserver | null>(null)
  const imageObserverRef = useRef<MutationObserver | null>(null)

  // 初始化性能监控
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 重置指标
    if (autoReset) {
      setMetrics(prev => ({
        ...prev,
        imageLoadTimes: {},
        totalImages: 0,
        loadedImages: 0,
        failedImages: 0,
        startTime: Date.now(),
        lastUpdate: Date.now()
      }))
    }

    // 监控性能条目
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          setMetrics(prev => {
            const updated = { ...prev, lastUpdate: Date.now() }
            
            // 处理导航指标
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              updated.ttfb = navEntry.responseStart - navEntry.requestStart
            }
            
            // 处理资源指标
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming
              updated.totalResourceCount += 1
              updated.totalTransferSize += resourceEntry.transferSize || 0
              
              // 图片资源特殊处理
              if (resourceEntry.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i)) {
                const imageId = resourceEntry.name.split('/').pop()?.split('?')[0] || 'unknown'
                const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart
                updated.imageLoadTimes[imageId] = loadTime
                updated.totalImages += 1
                
                if (resourceEntry.responseEnd > 0) {
                  updated.loadedImages += 1
                } else {
                  updated.failedImages += 1
                }
              }
            }
            
            // 处理绘制指标
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                updated.fcp = entry.startTime
              }
            }
            
            // 处理LCP
            if (entry.entryType === 'largest-contentful-paint') {
              updated.lcp = entry.startTime
            }
            
            // 处理布局偏移
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              updated.cls = (updated.cls || 0) + (entry as any).value
            }
            
            return updated
          })
        })
      })

      // 观察所有类型的性能条目
      try {
        observerRef.current.observe({ 
          entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint', 'layout-shift'] 
        })
      } catch (e) {
        console.warn('某些性能指标不被支持:', e)
      }
    }

    // 监控图片元素
    if (trackImages && 'MutationObserver' in window) {
      imageObserverRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              const images = element.tagName === 'IMG' 
                ? [element as HTMLImageElement]
                : Array.from(element.querySelectorAll('img'))
              
              images.forEach((img) => {
                const startTime = Date.now()
                
                const handleLoad = () => {
                  const loadTime = Date.now() - startTime
                  const imageId = img.src.split('/').pop()?.split('?')[0] || 'unknown'
                  
                  setMetrics(prev => ({
                    ...prev,
                    imageLoadTimes: {
                      ...prev.imageLoadTimes,
                      [imageId]: loadTime
                    },
                    loadedImages: prev.loadedImages + 1,
                    lastUpdate: Date.now()
                  }))
                }
                
                const handleError = () => {
                  setMetrics(prev => ({
                    ...prev,
                    failedImages: prev.failedImages + 1,
                    lastUpdate: Date.now()
                  }))
                }
                
                if (img.complete) {
                  if (img.naturalWidth > 0) {
                    handleLoad()
                  } else {
                    handleError()
                  }
                } else {
                  img.addEventListener('load', handleLoad, { once: true })
                  img.addEventListener('error', handleError, { once: true })
                }
              })
            }
          })
        })
      })
      
      imageObserverRef.current.observe(document.body, {
        childList: true,
        subtree: true
      })
    }

    return () => {
      observerRef.current?.disconnect()
      imageObserverRef.current?.disconnect()
    }
  }, [trackImages, autoReset])

  // 通知父组件指标更新
  useEffect(() => {
    onMetricsUpdate?.(metrics)
  }, [metrics, onMetricsUpdate])

  return { metrics }
}
