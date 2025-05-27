interface VideoSource {
  src: string
  type: string
}

interface VideoOptimizationOptions {
  autoOptimizeFormat: boolean
  compressionQuality: 'low' | 'medium' | 'high' | 'auto'
  maxWidth?: number
  maxHeight?: number
}

// 获取优化的视频源
export function getOptimizedVideoSrc(
  originalSrc: string,
  options: VideoOptimizationOptions
): string {
  const { autoOptimizeFormat, compressionQuality, maxWidth, maxHeight } = options
  
  if (!autoOptimizeFormat) return originalSrc

  // 检测浏览器支持的格式
  const video = document.createElement('video')
  const formats = {
    webm: video.canPlayType('video/webm; codecs="vp9"'),
    mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    av1: video.canPlayType('video/mp4; codecs="av01.0.05M.08"')
  }

  // 根据支持情况和质量要求选择最佳格式
  let optimizedSrc = originalSrc
  const params = new URLSearchParams()

  // 添加质量参数
  if (compressionQuality !== 'auto') {
    const qualityMap = { low: 28, medium: 23, high: 18 }
    params.set('crf', qualityMap[compressionQuality].toString())
  }

  // 添加尺寸限制
  if (maxWidth) params.set('maxWidth', maxWidth.toString())
  if (maxHeight) params.set('maxHeight', maxHeight.toString())

  // 选择最佳格式
  if (formats.av1 && compressionQuality === 'high') {
    params.set('format', 'av1')
  } else if (formats.webm) {
    params.set('format', 'webm')
  } else {
    params.set('format', 'mp4')
  }

  const queryString = params.toString()
  if (queryString) {
    const separator = originalSrc.includes('?') ? '&' : '?'
    optimizedSrc = `${originalSrc}${separator}${queryString}`
  }

  return optimizedSrc
}

// 生成视频源列表（多格式支持）
export function generateVideoSources(
  currentSrc: string,
  options: VideoOptimizationOptions
): VideoSource[] {
  const optimizedSrc = getOptimizedVideoSrc(currentSrc, options)
  const sources: VideoSource[] = []

  // 添加主要格式
  if (optimizedSrc.includes('format=av1')) {
    sources.push({ src: optimizedSrc, type: 'video/mp4; codecs="av01.0.05M.08"' })
  }
  if (optimizedSrc.includes('format=webm')) {
    sources.push({ src: optimizedSrc.replace('format=webm', 'format=webm'), type: 'video/webm; codecs="vp9"' })
  }

  // 添加fallback MP4
  const mp4Src = optimizedSrc.replace(/format=[^&]+/, 'format=mp4')
  sources.push({ src: mp4Src, type: 'video/mp4; codecs="avc1.42E01E"' })

  return sources
}

// 计算视频加载进度
export function calculateLoadProgress(video: HTMLVideoElement): number {
  if (video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    const duration = video.duration
    if (duration > 0) {
      return (bufferedEnd / duration) * 100
    }
  }
  return 0
}
