import { useState, useEffect } from 'react'
import Head from 'next/head'
import { AdvancedVideo, VideoPlayer, VideoPreview, VideoThumbnail } from '@/components/ui/AdvancedVideo'
import { useVideoLazyLoading, useVideoPreloading, useVideoPlaybackState } from '@/hooks/useVideoLazyLoading'
import {
  generateOptimizedVideoUrl,
  getOptimalVideoQuality,
  VideoPerformanceMonitor,
  detectVideoFormatSupport
} from '@/lib/video-optimization'
import { VideoErrorRecovery, VideoPerformanceTracker } from '@/lib/video-error-handler'

const testVideos = [
  {
    id: 'sample-1',
    name: '示例视频 1',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    type: 'player'
  },
  {
    id: 'sample-2',
    name: '示例视频 2',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    type: 'preview'
  },
  {
    id: 'sample-3',
    name: '示例视频 3',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    type: 'thumbnail'
  },
  {
    id: 'sample-4',
    name: '示例视频 4',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    type: 'advanced'
  }
]

export default function AdvancedVideoTest() {
  const [enableLazyLoading, setEnableLazyLoading] = useState(true)
  const [compressionQuality, setCompressionQuality] = useState<'low' | 'medium' | 'high' | 'auto'>('auto')
  const [enablePreloading, setEnablePreloading] = useState(false)
  const [autoOptimizeFormat, setAutoOptimizeFormat] = useState(true)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [formatSupport, setFormatSupport] = useState<any>(null)
  const [errorRecovery] = useState(() => new VideoErrorRecovery())
  const [performanceTracker] = useState(() => new VideoPerformanceTracker())

  // 视频预加载
  const { preloadedVideos, isPreloading } = useVideoPreloading(
    testVideos.map(video => video.src),
    enablePreloading
  )

  // 性能监控
  useEffect(() => {
    const monitor = VideoPerformanceMonitor.getInstance()
    const interval = setInterval(() => {
      setPerformanceData({
        monitor: monitor.getMetrics(),
        tracker: performanceTracker.getMetrics()
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [performanceTracker])

  // 检测格式支持
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFormatSupport(detectVideoFormatSupport())
    }
  }, [])

  const [optimalQuality, setOptimalQuality] = useState<'low' | 'medium' | 'high'>('medium')

  // 客户端初始化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOptimalQuality(getOptimalVideoQuality())
    }
  }, [])

  return (
    <>
      <Head>
        <title>高级视频组件测试</title>
        <meta name="description" content="测试高级视频组件的懒加载、压缩和优化功能" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* 页面标题和控制面板 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              高级视频组件测试
            </h1>

            {/* 控制面板 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">控制面板</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableLazyLoading}
                      onChange={(e) => setEnableLazyLoading(e.target.checked)}
                      className="rounded"
                    />
                    <span>启用懒加载</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enablePreloading}
                      onChange={(e) => setEnablePreloading(e.target.checked)}
                      className="rounded"
                    />
                    <span>启用预加载</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoOptimizeFormat}
                      onChange={(e) => setAutoOptimizeFormat(e.target.checked)}
                      className="rounded"
                    />
                    <span>自动格式优化</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    压缩质量
                  </label>
                  <select
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(e.target.value as any)}
                    className="w-full rounded border-gray-300"
                  >
                    <option value="auto">自动</option>
                    <option value="low">低质量</option>
                    <option value="medium">中等质量</option>
                    <option value="high">高质量</option>
                  </select>
                </div>
              </div>

              {/* 系统信息 */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">系统信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">推荐质量:</span>
                    <span className="ml-2 font-mono">{optimalQuality}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">预加载状态:</span>
                    <span className="ml-2">{isPreloading ? '加载中...' : '完成'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">已预加载:</span>
                    <span className="ml-2 font-mono">{preloadedVideos.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">格式支持:</span>
                    <span className="ml-2">
                      {formatSupport && Object.entries(formatSupport)
                        .filter(([_, supported]) => supported)
                        .map(([format]) => format.toUpperCase())
                        .join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 视频播放器测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">视频播放器组件</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {testVideos.filter(video => video.type === 'player').map((video) => (
                <div key={video.id}>
                  <VideoPlayer
                    src={video.src}
                    poster={video.poster}
                    enableLazyLoading={enableLazyLoading}
                    autoOptimizeFormat={autoOptimizeFormat}
                    compressionQuality={compressionQuality}
                    onLoadStart={() => performanceTracker.startTracking(video.src)}
                    onLoadComplete={() => performanceTracker.recordLoadTime(video.src)}
                    onErrorOccurred={(error) => performanceTracker.recordError(video.src, error.message)}
                  />
                  <h3 className="font-medium mt-2">{video.name}</h3>
                  <VideoMetadataDisplay src={video.src} />
                </div>
              ))}
            </div>
          </div>

          {/* 视频预览测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">视频预览组件</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testVideos.filter(video => video.type === 'preview').map((video) => (
                <div key={video.id}>
                  <VideoPreview
                    src={video.src}
                    poster={video.poster}
                    onHover={true}
                    enableLazyLoading={enableLazyLoading}
                    autoOptimizeFormat={autoOptimizeFormat}
                    compressionQuality={compressionQuality}
                    onLoadStart={() => performanceTracker.startTracking(video.src)}
                    onLoadComplete={() => performanceTracker.recordLoadTime(video.src)}
                  />
                  <h3 className="font-medium mt-2">{video.name}</h3>
                  <p className="text-sm text-gray-500">悬停播放预览</p>
                </div>
              ))}
            </div>
          </div>

          {/* 视频缩略图测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">视频缩略图组件</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {testVideos.filter(video => video.type === 'thumbnail').map((video) => (
                <div key={video.id}>
                  <VideoThumbnail
                    src={video.src}
                    thumbnailTime={2}
                    width={200}
                    height={112}
                    onClick={() => alert(`播放 ${video.name}`)}
                  />
                  <h3 className="font-medium mt-2 text-sm">{video.name}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* 高级视频组件测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">高级视频组件</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {testVideos.filter(video => video.type === 'advanced').map((video) => (
                <div key={video.id}>
                  <AdvancedVideo
                    src={video.src}
                    poster={video.poster}
                    enableLazyLoading={enableLazyLoading}
                    autoOptimizeFormat={autoOptimizeFormat}
                    compressionQuality={compressionQuality}
                    retryCount={3}
                    showLoading={true}
                    enablePerformanceMonitoring={true}
                    onLoadStart={() => performanceTracker.startTracking(video.src)}
                    onLoadComplete={() => performanceTracker.recordLoadTime(video.src)}
                    onErrorOccurred={(error) => performanceTracker.recordError(video.src, error.message)}
                  />
                  <h3 className="font-medium mt-2">{video.name}</h3>
                  <p className="text-sm text-gray-500">
                    优化URL: {typeof window !== 'undefined' ? generateOptimizedVideoUrl(video.src, {
                      quality: compressionQuality,
                      format: 'auto'
                    }).substring(0, 50) + '...' : '服务端渲染中...'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 懒加载演示 */}
          <LazyLoadingVideoDemo enableLazyLoading={enableLazyLoading} />

          {/* 性能统计 */}
          {performanceData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">性能统计</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">监控数据</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>总视频数: {performanceData.monitor?.totalVideos || 0}</div>
                    <div>平均加载时间: {(performanceData.monitor?.averageLoadTime || 0).toFixed(0)}ms</div>
                    <div>成功率: {(performanceData.monitor?.successRate || 0).toFixed(1)}%</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">追踪数据</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>总请求: {performanceData.tracker?.total || 0}</div>
                    <div>成功: {performanceData.tracker?.successful || 0}</div>
                    <div>失败: {performanceData.tracker?.failed || 0}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">优化效果</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>懒加载: {enableLazyLoading ? '启用' : '禁用'}</p>
                    <p>格式优化: {autoOptimizeFormat ? '启用' : '禁用'}</p>
                    <p>质量设置: {compressionQuality}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// 视频元数据显示组件
function VideoMetadataDisplay({ src }: { src: string }) {
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      setMetadata({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2)
      })
      setLoading(false)
    }

    video.onerror = () => setLoading(false)
    video.src = src
  }, [src])

  if (loading) return <p className="text-xs text-gray-500">检测元数据中...</p>
  if (!metadata) return <p className="text-xs text-red-500">元数据检测失败</p>

  return (
    <p className="text-xs text-gray-500">
      {metadata.width} × {metadata.height} | {metadata.duration.toFixed(1)}s | 比例: {metadata.aspectRatio}
    </p>
  )
}

// 懒加载演示组件
function LazyLoadingVideoDemo({ enableLazyLoading }: { enableLazyLoading: boolean }) {
  const { isInView, ref } = useVideoLazyLoading({
    disabled: !enableLazyLoading,
    rootMargin: '100px'
  })

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">懒加载演示</h2>
      <div className="h-96 overflow-y-auto border rounded">
        <div className="h-80 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">向下滚动查看懒加载效果</p>
        </div>
        <div ref={ref} className="h-64 flex items-center justify-center">
          {isInView ? (
            <VideoPlayer
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
              poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg"
              containerClassName="w-full max-w-md"
            />
          ) : (
            <div className="w-96 h-64 bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-500">视频将在进入视口时加载</p>
            </div>
          )}
        </div>
        <div className="h-80 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">懒加载演示区域</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        状态: {isInView ? '已进入视口，视频已加载' : '未进入视口'}
      </p>
    </div>
  )
}
