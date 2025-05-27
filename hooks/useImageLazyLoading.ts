import { useState, useEffect, useRef, useCallback } from 'react'

export interface LazyLoadingOptions {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
  disabled?: boolean
}

export interface LazyLoadingResult {
  isInView: boolean
  ref: React.RefObject<HTMLElement>
  entry: IntersectionObserverEntry | null
}

/**
 * 图片懒加载Hook
 * 使用Intersection Observer API实现高性能的懒加载
 */
export function useImageLazyLoading(options: LazyLoadingOptions = {}): LazyLoadingResult {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true,
    disabled = false
  } = options

  const [isInView, setIsInView] = useState(disabled)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (disabled || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
        
        if (entry.isIntersecting) {
          setIsInView(true)
          
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsInView(false)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [rootMargin, threshold, triggerOnce, disabled])

  return { isInView, ref, entry }
}

/**
 * 批量图片懒加载Hook
 */
export function useBatchImageLazyLoading(
  count: number,
  options: LazyLoadingOptions = {}
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const refs = useRef<(HTMLElement | null)[]>(new Array(count).fill(null))

  const setRef = useCallback((index: number) => (element: HTMLElement | null) => {
    refs.current[index] = element
  }, [])

  useEffect(() => {
    if (options.disabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = refs.current.findIndex(ref => ref === entry.target)
          if (index !== -1) {
            setVisibleItems(prev => {
              const newSet = new Set(prev)
              if (entry.isIntersecting) {
                newSet.add(index)
              } else if (!options.triggerOnce) {
                newSet.delete(index)
              }
              return newSet
            })
          }
        })
      },
      {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1
      }
    )

    refs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [count, options])

  return {
    visibleItems,
    setRef,
    isVisible: (index: number) => visibleItems.has(index)
  }
}

/**
 * 图片预加载Hook
 */
export function useImagePreloading(sources: string[], enabled: boolean = true) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src))
        resolve()
      }
      img.onerror = () => {
        setFailedImages(prev => new Set(prev).add(src))
        reject(new Error(`Failed to load image: ${src}`))
      }
      img.src = src
    })
  }, [])

  useEffect(() => {
    if (!enabled || sources.length === 0) return

    setIsLoading(true)
    setLoadedImages(new Set())
    setFailedImages(new Set())

    const preloadPromises = sources.map(src => 
      preloadImage(src).catch(() => {}) // 忽略单个图片的错误
    )

    Promise.allSettled(preloadPromises).finally(() => {
      setIsLoading(false)
    })
  }, [sources, enabled, preloadImage])

  return {
    loadedImages,
    failedImages,
    isLoading,
    isImageLoaded: (src: string) => loadedImages.has(src),
    isImageFailed: (src: string) => failedImages.has(src)
  }
}

/**
 * 图片加载状态Hook
 */
export function useImageLoadingState(src: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(() => {
    setLoading(false)
    setError(false)
    setLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setError(true)
    setLoaded(false)
  }, [])

  const reset = useCallback(() => {
    setLoading(true)
    setError(false)
    setLoaded(false)
  }, [])

  useEffect(() => {
    reset()
  }, [src, reset])

  return {
    loading,
    error,
    loaded,
    handleLoad,
    handleError,
    reset
  }
}

/**
 * 图片尺寸检测Hook
 */
export function useImageDimensions(src: string) {
  const [dimensions, setDimensions] = useState<{
    width: number
    height: number
    aspectRatio: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!src) return

    setLoading(true)
    setError(null)
    setDimensions(null)

    const img = new Image()
    
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      })
      setLoading(false)
    }

    img.onerror = () => {
      setError('Failed to load image dimensions')
      setLoading(false)
    }

    img.src = src
  }, [src])

  return { dimensions, loading, error }
}

/**
 * 响应式图片Hook
 */
export function useResponsiveImage(
  src: string,
  breakpoints: { [key: string]: { width?: number; height?: number; quality?: number } } = {}
) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('default')
  const [optimizedSrc, setOptimizedSrc] = useState(src)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      // 根据屏幕宽度确定当前断点
      let breakpoint = 'default'
      if (width <= 640) breakpoint = 'sm'
      else if (width <= 768) breakpoint = 'md'
      else if (width <= 1024) breakpoint = 'lg'
      else if (width <= 1280) breakpoint = 'xl'
      else breakpoint = '2xl'

      setCurrentBreakpoint(breakpoint)

      // 生成优化的图片URL
      const config = breakpoints[breakpoint] || {}
      const params = new URLSearchParams()
      
      if (config.width) params.set('w', config.width.toString())
      if (config.height) params.set('h', config.height.toString())
      if (config.quality) params.set('q', config.quality.toString())
      
      const queryString = params.toString()
      const separator = src.includes('?') ? '&' : '?'
      const newSrc = queryString ? `${src}${separator}${queryString}` : src
      
      setOptimizedSrc(newSrc)
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [src, breakpoints])

  return {
    currentBreakpoint,
    optimizedSrc,
    config: breakpoints[currentBreakpoint] || {}
  }
}

export default {
  useImageLazyLoading,
  useBatchImageLazyLoading,
  useImagePreloading,
  useImageLoadingState,
  useImageDimensions,
  useResponsiveImage
}
