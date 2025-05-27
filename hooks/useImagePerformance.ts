import { useState, useEffect, useCallback } from 'react'

interface ImageMetrics {
  loadTime: number
  fileSize?: number
  format?: string
  cached: boolean
  error?: string
}

interface PerformanceData {
  totalImages: number
  averageLoadTime: number
  successRate: number
  cacheHitRate: number
  metrics: Map<string, ImageMetrics>
}

/**
 * 图片性能监控Hook
 */
export function useImagePerformance() {
  const [data, setData] = useState<PerformanceData>({
    totalImages: 0,
    averageLoadTime: 0,
    successRate: 0,
    cacheHitRate: 0,
    metrics: new Map()
  })

  const recordMetric = useCallback((src: string, metric: ImageMetrics) => {
    setData(prev => {
      const newMetrics = new Map(prev.metrics)
      newMetrics.set(src, metric)
      
      const totalImages = newMetrics.size
      const loadTimes = Array.from(newMetrics.values()).map(m => m.loadTime)
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      const successCount = Array.from(newMetrics.values()).filter(m => !m.error).length
      const successRate = (successCount / totalImages) * 100
      const cacheCount = Array.from(newMetrics.values()).filter(m => m.cached).length
      const cacheHitRate = (cacheCount / totalImages) * 100
      
      return {
        totalImages,
        averageLoadTime,
        successRate,
        cacheHitRate,
        metrics: newMetrics
      }
    })
  }, [])

  const startTiming = useCallback((src: string) => {
    const startTime = performance.now()
    
    return {
      onLoad: () => {
        const loadTime = performance.now() - startTime
        recordMetric(src, {
          loadTime,
          cached: loadTime < 50, // 假设小于50ms为缓存命中
        })
      },
      onError: (error: string) => {
        const loadTime = performance.now() - startTime
        recordMetric(src, {
          loadTime,
          cached: false,
          error
        })
      }
    }
  }, [recordMetric])

  return {
    data,
    startTiming,
    recordMetric
  }
}

export default useImagePerformance