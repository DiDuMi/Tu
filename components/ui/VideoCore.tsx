import React, { useRef, useCallback } from 'react'

import { cn } from '@/lib/utils'

interface VideoSource {
  src: string
  type: string
}

interface VideoCoreProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  sources: VideoSource[]
  poster?: string
  fallbackPoster?: string
  maxWidth?: number
  maxHeight?: number
  onLoadStart?: () => void
  onLoadedData?: () => void
  onProgress?: () => void
  onError?: () => void
  className?: string
}

export default function VideoCore({
  sources,
  poster,
  fallbackPoster = '/images/video-placeholder.svg',
  maxWidth,
  maxHeight,
  onLoadStart,
  onLoadedData,
  onProgress,
  onError,
  className = '',
  ...props
}: VideoCoreProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleLoadStart = useCallback(() => {
    onLoadStart?.()
  }, [onLoadStart])

  const handleLoadedData = useCallback(() => {
    onLoadedData?.()
  }, [onLoadedData])

  const handleProgress = useCallback(() => {
    onProgress?.()
  }, [onProgress])

  const handleError = useCallback(() => {
    onError?.()
  }, [onError])

  return (
    <video
      ref={videoRef}
      className={cn('w-full h-full object-cover', className)}
      poster={poster || fallbackPoster}
      onLoadStart={handleLoadStart}
      onLoadedData={handleLoadedData}
      onProgress={handleProgress}
      onError={handleError}
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : '100%',
        maxHeight: maxHeight ? `${maxHeight}px` : '100%'
      }}
      {...props}
    >
      {sources.map((source, index) => (
        <source key={index} src={source.src} type={source.type} />
      ))}
      您的浏览器不支持视频播放
    </video>
  )
}
