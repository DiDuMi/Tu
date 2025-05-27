import React, { useState, useRef, useEffect } from 'react'
import NextImage from 'next/image'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  placeholder?: string
  blurDataURL?: string
  priority?: boolean
  sizes?: string
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  placeholder = 'empty',
  blurDataURL,
  priority = false,
  sizes,
  quality = 75,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // 如果是优先级图片，立即加载
  const imgRef = useRef<HTMLDivElement>(null)

  // 生成简单的模糊占位符
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    // 创建一个简单的SVG模糊占位符
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `
    // 使用btoa进行base64编码，兼容浏览器环境
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  // 使用 Intersection Observer 实现懒加载
  useEffect(() => {
    if (priority) {
      // 如果是优先级图片，立即设置为可见
      setIsInView(true)
      return
    }

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
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // 只有在明确提供blurDataURL时才使用blur placeholder
  const shouldUseBlur = placeholder === 'blur' && blurDataURL
  const finalPlaceholder = shouldUseBlur ? 'blur' : 'empty'
  const defaultBlurDataURL = shouldUseBlur ? blurDataURL : undefined

  if (fill) {
    return (
      <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
        {/* 加载占位符 */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-border dark:to-dark-bg animate-pulse" />
        )}

        {/* 错误占位符 */}
        {hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-border dark:to-dark-bg flex items-center justify-center">
            <div className="text-center text-gray-400 dark:text-dark-muted">
              <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">加载失败</span>
            </div>
          </div>
        )}

        {/* 实际图片 */}
        {isInView && !hasError && (
          <NextImage
            src={src}
            alt={alt}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleLoad}
            onError={handleError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
      </div>
    )
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {/* 加载占位符 */}
      {!isLoaded && !hasError && (
        <div
          className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-border dark:to-dark-bg animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* 错误占位符 */}
      {hasError && (
        <div
          className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-border dark:to-dark-bg flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center text-gray-400 dark:text-dark-muted">
            <svg className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">加载失败</span>
          </div>
        </div>
      )}

      {/* 实际图片 */}
      {isInView && !hasError && width && height && (
        <NextImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  )
}

// 头像懒加载组件
export function LazyAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string
  alt: string
  size?: number
  className?: string
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
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <LazyImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      onError={() => setHasError(true)}
    />
  )
}
