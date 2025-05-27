import React, { useState, useEffect } from 'react'
import NextImage from 'next/image'

interface MediaPreviewImageProps {
  src: string
  alt: string
  type?: 'image' | 'video' | 'document'
  className?: string
  containerClassName?: string
  maxWidth?: number
  maxHeight?: number
  showInfo?: boolean
  onClick?: () => void
  useOptimized?: boolean // 是否使用Next.js Image优化
}

/**
 * 媒体预览图片组件
 * 支持动态尺寸和原生img fallback
 */
export function MediaPreviewImage({
  src,
  alt,
  type = 'image',
  className = '',
  containerClassName = '',
  maxWidth,
  maxHeight,
  showInfo = false,
  onClick,
  useOptimized = true
}: MediaPreviewImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null)
  const [naturalDimensions, setNaturalDimensions] = useState<{width: number, height: number} | null>(null)

  // 获取图片原始尺寸
  useEffect(() => {
    if (src && type === 'image') {
      const img = new Image()
      img.onload = () => {
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight })

        // 计算显示尺寸
        let displayWidth = img.naturalWidth
        let displayHeight = img.naturalHeight

        if (maxWidth && displayWidth > maxWidth) {
          displayHeight = (displayHeight * maxWidth) / displayWidth
          displayWidth = maxWidth
        }

        if (maxHeight && displayHeight > maxHeight) {
          displayWidth = (displayWidth * maxHeight) / displayHeight
          displayHeight = maxHeight
        }

        setDimensions({ width: Math.round(displayWidth), height: Math.round(displayHeight) })
      }
      img.onerror = () => {
        setError(true)
        setLoading(false)
      }
      img.src = src
    }
  }, [src, type, maxWidth, maxHeight])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  // 如果不是图片类型，显示文件图标
  if (type !== 'image') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${containerClassName} ${className}`}
        onClick={onClick}
      >
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {type === 'video' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
          </svg>
          <p className="text-xs font-medium">{type.toUpperCase()}</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${containerClassName} ${className}`}
        onClick={onClick}
      >
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">图片加载失败</p>
        </div>
      </div>
    )
  }

  // 如果使用优化版本且有尺寸信息
  if (useOptimized && dimensions) {
    return (
      <div className={`relative ${containerClassName}`} onClick={onClick}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}

        <NextImage
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            maxWidth: maxWidth ? `${maxWidth}px` : '100%',
            maxHeight: maxHeight ? `${maxHeight}px` : '100%',
            width: 'auto',
            height: 'auto'
          }}
        />

        {showInfo && !loading && !error && naturalDimensions && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="text-white text-xs">
              {naturalDimensions.width} × {naturalDimensions.height}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback到Next.js Image组件
  return (
    <div className={`relative ${containerClassName}`} onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      <NextImage
        src={src}
        alt={alt}
        width={maxWidth || 400}
        height={maxHeight || 300}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          maxWidth: maxWidth ? `${maxWidth}px` : '100%',
          maxHeight: maxHeight ? `${maxHeight}px` : '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain'
        }}
      />

      {showInfo && !loading && !error && naturalDimensions && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="text-white text-xs">
            {naturalDimensions.width} × {naturalDimensions.height}
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaPreviewImage
