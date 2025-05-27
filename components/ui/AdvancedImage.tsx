import React, { useState, useEffect, useRef } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface AdvancedImageProps extends Omit<ImageProps, 'src' | 'onLoad' | 'onError'> {
  src: string
  fallback?: string
  showLoading?: boolean
  enableLazyLoading?: boolean
  compressionQuality?: number
  retryCount?: number
  retryDelay?: number
  onLoadComplete?: () => void
  onErrorOccurred?: (error: Error) => void
  containerClassName?: string
  loadingClassName?: string
  errorClassName?: string
  blurDataURL?: string
  placeholder?: 'blur' | 'empty'
}

/**
 * 高级图片组件 - 集成懒加载、压缩、错误处理和重试机制
 */
export function AdvancedImage({
  src,
  alt,
  fallback = '/images/placeholder.svg',
  showLoading = true,
  enableLazyLoading = true,
  compressionQuality = 75,
  retryCount = 2,
  retryDelay = 1000,
  onLoadComplete,
  onErrorOccurred,
  containerClassName = '',
  loadingClassName = '',
  errorClassName = '',
  blurDataURL,
  placeholder = 'empty',
  className = '',
  priority = false,
  ...props
}: AdvancedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [attempts, setAttempts] = useState(0)
  const [isInView, setIsInView] = useState(!enableLazyLoading || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // 懒加载 Intersection Observer
  useEffect(() => {
    if (!enableLazyLoading || priority || isInView) return

    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1,
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [enableLazyLoading, priority, isInView])

  // 重置状态当src改变时
  useEffect(() => {
    if (src !== currentSrc) {
      setError(false)
      setLoading(true)
      setCurrentSrc(src)
      setAttempts(0)
    }
  }, [src, currentSrc])

  // 处理加载成功
  const handleLoad = () => {
    setLoading(false)
    setError(false)
    onLoadComplete?.()
  }

  // 处理加载错误和重试
  const handleError = () => {
    if (attempts < retryCount) {
      // 重试机制
      setTimeout(() => {
        setAttempts(prev => prev + 1)
        setCurrentSrc(`${src}?retry=${attempts + 1}`)
      }, retryDelay)
    } else {
      // 使用fallback图片
      if (fallback && currentSrc !== fallback) {
        setCurrentSrc(fallback)
        setAttempts(0)
      } else {
        setLoading(false)
        setError(true)
        onErrorOccurred?.(new Error(`Failed to load image: ${src}`))
      }
    }
  }

  // 生成优化的图片URL
  const getOptimizedSrc = (originalSrc: string) => {
    // 如果是本地图片，添加压缩参数
    if (originalSrc.startsWith('/') || (typeof window !== 'undefined' && originalSrc.includes(window.location.origin))) {
      const separator = originalSrc.includes('?') ? '&' : '?'
      return `${originalSrc}${separator}q=${compressionQuality}&auto=format`
    }
    return originalSrc
  }

  // 生成模糊占位符
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL

    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>
    `
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', containerClassName)}>
      {/* 加载状态 */}
      {showLoading && loading && (
        <div className={cn(
          'absolute inset-0 bg-gray-100 animate-pulse rounded z-10 flex items-center justify-center',
          loadingClassName
        )}>
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className={cn(
          'absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 rounded',
          errorClassName
        )}>
          <div className="text-center">
            <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">加载失败</span>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && !error && (
        <NextImage
          src={getOptimizedSrc(currentSrc)}
          alt={alt}
          {...props}
          className={cn(
            className,
            loading ? 'opacity-0' : 'opacity-100',
            'transition-opacity duration-300'
          )}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          quality={compressionQuality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? generateBlurDataURL() : undefined}
          sizes={props.sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        />
      )}

      {/* 重试指示器 */}
      {attempts > 0 && attempts < retryCount && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          重试 {attempts}/{retryCount}
        </div>
      )}
    </div>
  )
}

/**
 * 头像专用组件
 */
export function AdvancedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallbackText,
  ...props
}: Omit<AdvancedImageProps, 'width' | 'height' | 'fill'> & {
  size?: number
  fallbackText?: string
}) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold rounded-full',
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallbackText || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <AdvancedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      onErrorOccurred={() => setHasError(true)}
      enableLazyLoading={false} // 头像通常需要立即显示
      {...props}
    />
  )
}

/**
 * 封面图片专用组件
 */
export function AdvancedCover({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  containerClassName = '',
  ...props
}: Omit<AdvancedImageProps, 'fill'> & {
  aspectRatio?: string
}) {
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg', containerClassName)}
      style={{ aspectRatio }}
    >
      <AdvancedImage
        src={src}
        alt={alt}
        fill
        className={cn('object-cover', className)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        placeholder="blur"
        {...props}
      />
    </div>
  )
}

export default AdvancedImage
