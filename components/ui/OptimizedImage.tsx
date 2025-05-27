import React, { useState, useEffect } from 'react'
import NextImage, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'onLoad' | 'onError'> {
  src: string
  fallback?: string
  showLoading?: boolean
  containerClassName?: string
  loadingClassName?: string
  errorClassName?: string
  onLoadComplete?: () => void
  onErrorOccurred?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
}

/**
 * 优化的图片组件，基于Next.js Image组件
 * 提供错误处理、加载状态、重试机制和fallback功能
 */
export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.svg',
  showLoading = true,
  containerClassName = '',
  loadingClassName = '',
  errorClassName = '',
  onLoadComplete,
  onErrorOccurred,
  retryCount = 2,
  retryDelay = 1000,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [attempts, setAttempts] = useState(0)

  // 重置状态当src改变时
  useEffect(() => {
    if (src !== currentSrc) {
      setError(false)
      setLoading(true)
      setCurrentSrc(src)
      setAttempts(0)
    }
  }, [src, currentSrc])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
    onLoadComplete?.()
  }

  const handleError = () => {
    setLoading(false)
    
    // 重试机制
    if (attempts < retryCount) {
      setTimeout(() => {
        setAttempts(prev => prev + 1)
        setLoading(true)
        setError(false)
        // 强制重新加载图片
        setCurrentSrc(`${src}?retry=${attempts + 1}`)
      }, retryDelay)
      return
    }

    setError(true)
    onErrorOccurred?.(new Error(`Failed to load image: ${src}`))
  }

  // 如果有错误且有fallback，显示fallback图片
  if (error && fallback) {
    return (
      <div className={`relative ${containerClassName}`}>
        <NextImage
          src={fallback}
          alt={`${alt} (fallback)`}
          {...props}
          className={`${className} ${errorClassName}`}
          onLoad={() => setLoading(false)}
        />
        {showLoading && loading && (
          <div className={`absolute inset-0 bg-gray-100 animate-pulse rounded ${loadingClassName}`} />
        )}
      </div>
    )
  }

  // 如果有错误但没有fallback，显示错误占位符
  if (error) {
    return (
      <div className={`relative flex items-center justify-center bg-gray-100 ${containerClassName} ${errorClassName}`}>
        <div className="text-center text-gray-400">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">图片加载失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {showLoading && loading && (
        <div className={`absolute inset-0 bg-gray-100 animate-pulse rounded z-10 ${loadingClassName}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      )}
      <NextImage
        src={currentSrc}
        alt={alt}
        {...props}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

/**
 * 头像专用组件
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: number
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      fallback="/images/default-avatar.svg"
      containerClassName="flex-shrink-0"
      priority={size >= 64} // 大头像优先加载
      {...props}
    />
  )
}

/**
 * 封面图片专用组件
 */
export function CoverImage({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  containerClassName = '',
  ...props
}: Omit<OptimizedImageProps, 'fill'> & {
  aspectRatio?: string
}) {
  return (
    <div 
      className={`relative w-full overflow-hidden ${containerClassName}`}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}

export default OptimizedImage
