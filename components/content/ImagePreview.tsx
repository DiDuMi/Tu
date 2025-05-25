import { useState, useEffect } from 'react'
import { getImageDimensions } from '@/lib/cover-image-utils'

interface ImagePreviewProps {
  src: string
  alt: string
  className?: string
  showInfo?: boolean
  onClick?: () => void
}

export default function ImagePreview({ 
  src, 
  alt, 
  className = '', 
  showInfo = false,
  onClick 
}: ImagePreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dimensions, setDimensions] = useState<{width: number, height: number} | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  useEffect(() => {
    if (src && showInfo) {
      // 获取图片尺寸
      getImageDimensions(src).then(setDimensions)
      
      // 尝试获取文件大小（仅对本地文件有效）
      if (src.startsWith('/') || src.includes(window.location.origin)) {
        fetch(src, { method: 'HEAD' })
          .then(response => {
            const size = response.headers.get('content-length')
            if (size) {
              const sizeInKB = Math.round(parseInt(size) / 1024)
              setFileSize(sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)}MB` : `${sizeInKB}KB`)
            }
          })
          .catch(() => {
            // 忽略错误
          })
      }
    }
  }, [src, showInfo])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: loading ? 'none' : 'block' }}
        />
      )}

      {showInfo && !loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="text-white text-xs space-y-1">
            {dimensions && (
              <div>{dimensions.width} × {dimensions.height}</div>
            )}
            {fileSize && (
              <div>{fileSize}</div>
            )}
          </div>
        </div>
      )}

      {onClick && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors cursor-pointer" />
      )}
    </div>
  )
}
