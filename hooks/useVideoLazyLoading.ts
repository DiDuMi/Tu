import { useState, useEffect, useRef, useCallback } from 'react'

export interface VideoLazyLoadingOptions {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
  disabled?: boolean
  preloadDistance?: number
}

export interface VideoLazyLoadingResult {
  isInView: boolean
  ref: React.RefObject<HTMLElement>
  entry: IntersectionObserverEntry | null
  loadVideo: () => void
  unloadVideo: () => void
}

/**
 * 视频懒加载Hook
 * 专门为视频优化的懒加载实现
 */
export function useVideoLazyLoading(options: VideoLazyLoadingOptions = {}): VideoLazyLoadingResult {
  const {
    rootMargin = '100px',
    threshold = 0.1,
    triggerOnce = true,
    disabled = false,
    preloadDistance = 200
  } = options

  const [isInView, setIsInView] = useState(disabled)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const ref = useRef<HTMLElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadVideo = useCallback(() => {
    setIsInView(true)
  }, [])

  const unloadVideo = useCallback(() => {
    if (!triggerOnce) {
      setIsInView(false)
    }
  }, [triggerOnce])

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

    observerRef.current = observer
    observer.observe(ref.current)

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [rootMargin, threshold, triggerOnce, disabled])

  return { isInView, ref, entry, loadVideo, unloadVideo }
}

/**
 * 批量视频懒加载Hook
 */
export function useBatchVideoLazyLoading(
  count: number,
  options: VideoLazyLoadingOptions = {}
) {
  const [visibleVideos, setVisibleVideos] = useState<Set<number>>(new Set())
  const [loadingVideos, setLoadingVideos] = useState<Set<number>>(new Set())
  const refs = useRef<(HTMLElement | null)[]>(new Array(count).fill(null))

  const setRef = useCallback((index: number) => (element: HTMLElement | null) => {
    refs.current[index] = element
  }, [])

  const loadVideo = useCallback((index: number) => {
    setLoadingVideos(prev => new Set(prev).add(index))
    setVisibleVideos(prev => new Set(prev).add(index))
  }, [])

  const unloadVideo = useCallback((index: number) => {
    if (!options.triggerOnce) {
      setVisibleVideos(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
    setLoadingVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }, [options.triggerOnce])

  useEffect(() => {
    if (options.disabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = refs.current.findIndex(ref => ref === entry.target)
          if (index !== -1) {
            if (entry.isIntersecting) {
              loadVideo(index)
            } else if (!options.triggerOnce) {
              unloadVideo(index)
            }
          }
        })
      },
      {
        rootMargin: options.rootMargin || '100px',
        threshold: options.threshold || 0.1
      }
    )

    refs.current.forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [count, options, loadVideo, unloadVideo])

  return {
    visibleVideos,
    loadingVideos,
    setRef,
    isVisible: (index: number) => visibleVideos.has(index),
    isLoading: (index: number) => loadingVideos.has(index),
    loadVideo,
    unloadVideo
  }
}

/**
 * 视频预加载Hook
 */
export function useVideoPreloading(sources: string[], enabled: boolean = true) {
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set())
  const [failedVideos, setFailedVideos] = useState<Set<string>>(new Set())
  const [isPreloading, setIsPreloading] = useState(false)

  const preloadVideo = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        setPreloadedVideos(prev => new Set(prev).add(src))
        resolve()
      }
      
      video.onerror = () => {
        setFailedVideos(prev => new Set(prev).add(src))
        reject(new Error(`Failed to preload video: ${src}`))
      }
      
      video.src = src
    })
  }, [])

  useEffect(() => {
    if (!enabled || sources.length === 0) return

    setIsPreloading(true)
    setPreloadedVideos(new Set())
    setFailedVideos(new Set())

    const preloadPromises = sources.map(src => 
      preloadVideo(src).catch(() => {}) // 忽略单个视频的错误
    )

    Promise.allSettled(preloadPromises).finally(() => {
      setIsPreloading(false)
    })
  }, [sources, enabled, preloadVideo])

  return {
    preloadedVideos,
    failedVideos,
    isPreloading,
    isVideoPreloaded: (src: string) => preloadedVideos.has(src),
    isVideoFailed: (src: string) => failedVideos.has(src)
  }
}

/**
 * 视频播放状态Hook
 */
export function useVideoPlaybackState(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const play = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('播放失败:', error)
      }
    }
  }, [videoRef])

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [videoRef])

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [videoRef])

  const setVideoVolume = useCallback((vol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = vol
      setVolume(vol)
    }
  }, [videoRef])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setMuted(videoRef.current.muted)
    }
  }, [videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('progress', handleProgress)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('progress', handleProgress)
    }
  }, [videoRef])

  return {
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    play,
    pause,
    seek,
    setVolume: setVideoVolume,
    toggleMute
  }
}

/**
 * 视频质量自适应Hook
 */
export function useAdaptiveVideoQuality(videoRef: React.RefObject<HTMLVideoElement>) {
  const [currentQuality, setCurrentQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [availableQualities, setAvailableQualities] = useState<string[]>([])

  const detectOptimalQuality = useCallback(() => {
    if (typeof navigator === 'undefined') return 'medium'

    // 检测网络连接
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      const { effectiveType, downlink } = connection
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'low'
      } else if (effectiveType === '3g' || downlink < 2) {
        return 'medium'
      } else if (effectiveType === '4g' || downlink > 5) {
        return 'high'
      }
    }

    // 检测设备性能
    const deviceMemory = (navigator as any).deviceMemory
    if (deviceMemory && deviceMemory < 4) {
      return 'medium'
    }

    return 'high'
  }, [])

  const switchQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setCurrentQuality(quality)
    // 这里可以实现实际的质量切换逻辑
  }, [])

  useEffect(() => {
    const optimalQuality = detectOptimalQuality()
    setCurrentQuality(optimalQuality)
  }, [detectOptimalQuality])

  return {
    currentQuality,
    availableQualities,
    switchQuality,
    detectOptimalQuality
  }
}

export default {
  useVideoLazyLoading,
  useBatchVideoLazyLoading,
  useVideoPreloading,
  useVideoPlaybackState,
  useAdaptiveVideoQuality
}
