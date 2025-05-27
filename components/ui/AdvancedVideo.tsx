import React, { useState, useEffect, useRef, useCallback } from 'react'

import { useVideoLazyLoading } from '@/hooks/useVideoLazyLoading'
import { cn } from '@/lib/utils'
import { VideoPerformanceMonitor } from '@/lib/video-optimization'

import VideoControls from './VideoControls'
import VideoCore from './VideoCore'
import VideoErrorState from './VideoErrorState'
import VideoLoadingState from './VideoLoadingState'
import { generateVideoSources, calculateLoadProgress } from './VideoOptimization'

export interface AdvancedVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string
  poster?: string
  fallbackPoster?: string
  enableLazyLoading?: boolean
  enablePreload?: boolean
  autoOptimizeFormat?: boolean
  compressionQuality?: 'low' | 'medium' | 'high' | 'auto'
  retryCount?: number
  retryDelay?: number
  showLoading?: boolean
  showControls?: boolean
  onLoadStart?: () => void
  onLoadComplete?: () => void
  onErrorOccurred?: (error: Error) => void
  onProgress?: (progress: number) => void
  containerClassName?: string
  loadingClassName?: string
  errorClassName?: string
  aspectRatio?: string
  maxWidth?: number
  maxHeight?: number
  enablePerformanceMonitoring?: boolean
}

/**
 * 高级视频组件 - 集成懒加载、格式优化、错误处理和性能监控
 */
export function AdvancedVideo({
  src,
  poster,
  fallbackPoster = '/images/video-placeholder.svg',
  enableLazyLoading = true,
  enablePreload = false,
  autoOptimizeFormat = true,
  compressionQuality = 'auto',
  retryCount = 2,
  retryDelay = 1000,
  showLoading = true,
  showControls = true,
  onLoadStart,
  onLoadComplete,
  onErrorOccurred,
  onProgress,
  containerClassName = '',
  loadingClassName = '',
  errorClassName = '',
  aspectRatio = '16/9',
  maxWidth,
  maxHeight,
  enablePerformanceMonitoring = true,
  className = '',
  ...props
}: AdvancedVideoProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [currentPoster, setCurrentPoster] = useState(poster)
  const [attempts, setAttempts] = useState(0)
  const [loadProgress, setLoadProgress] = useState(0)
  const [videoReady, setVideoReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const performanceMonitor = useRef<VideoPerformanceMonitor | null>(null)

  // 懒加载Hook
  const { isInView } = useVideoLazyLoading({
    disabled: !enableLazyLoading || enablePreload,
    rootMargin: '100px',
    threshold: 0.1
  })

  // 初始化性能监控
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.current = new VideoPerformanceMonitor()
    }
  }, [enablePerformanceMonitoring])

  // 重置状态当src改变时
  useEffect(() => {
    if (src !== currentSrc) {
      setError(false)
      setLoading(true)
      setCurrentSrc(src)
      setAttempts(0)
      setLoadProgress(0)
      setVideoReady(false)
    }
  }, [src, currentSrc])

  // 优化函数已移至VideoOptimization组件

  // 处理加载开始
  const handleLoadStart = useCallback(() => {
    setLoading(true)
    setError(false)
    onLoadStart?.()

    if (performanceMonitor.current) {
      performanceMonitor.current.startTiming(currentSrc)
    }
  }, [currentSrc, onLoadStart])

  // 处理加载完成
  const handleLoadedData = useCallback(() => {
    setLoading(false)
    setVideoReady(true)
    onLoadComplete?.()

    if (performanceMonitor.current) {
      performanceMonitor.current.recordLoadComplete(currentSrc)
    }
  }, [currentSrc, onLoadComplete])

  // 处理加载进度
  const handleProgress = useCallback(() => {
    if (!videoRef.current) return

    const progress = calculateLoadProgress(videoRef.current)
    setLoadProgress(progress)
    onProgress?.(progress)
  }, [onProgress])

  // 处理错误和重试
  const handleError = useCallback(() => {
    if (attempts < retryCount) {
      // 重试机制
      setTimeout(() => {
        setAttempts(prev => prev + 1)
        setCurrentSrc(`${src}?retry=${attempts + 1}`)
      }, retryDelay)
    } else {
      // 尝试使用fallback poster
      if (poster && currentPoster !== fallbackPoster) {
        setCurrentPoster(fallbackPoster)
        setAttempts(0)
      } else {
        setLoading(false)
        setError(true)
        const errorObj = new Error(`Failed to load video: ${src}`)
        onErrorOccurred?.(errorObj)

        if (performanceMonitor.current) {
          performanceMonitor.current.recordError(currentSrc, errorObj.message)
        }
      }
    }
  }, [attempts, retryCount, retryDelay, src, poster, currentPoster, fallbackPoster, onErrorOccurred, currentSrc])

  // 生成视频源
  const videoSources = generateVideoSources(currentSrc, {
    autoOptimizeFormat,
    compressionQuality,
    maxWidth,
    maxHeight
  })

  // 只有在视图中或预加载启用时才渲染视频
  const shouldRenderVideo = isInView || enablePreload || !enableLazyLoading

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ aspectRatio }}
    >
      <VideoLoadingState
        isVisible={showLoading && loading}
        progress={loadProgress}
        className={loadingClassName}
      />

      <VideoErrorState
        isVisible={error}
        className={errorClassName}
      />

      {/* 实际视频 */}
      {shouldRenderVideo && !error && (
        <VideoCore
          ref={videoRef}
          sources={videoSources}
          poster={currentPoster}
          fallbackPoster={fallbackPoster}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          onLoadStart={handleLoadStart}
          onLoadedData={handleLoadedData}
          onProgress={handleProgress}
          onError={handleError}
          controls={showControls}
          className={cn(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            className
          )}
          {...props}
        />
      )}

      <VideoControls
        attempts={attempts}
        retryCount={retryCount}
        enablePerformanceMonitoring={enablePerformanceMonitoring}
        videoReady={videoReady}
        loadProgress={loadProgress}
      />
    </div>
  )
}

// VideoPlayer, VideoPreview, VideoThumbnail 组件已移至 VideoComponents.tsx

export default AdvancedVideo
