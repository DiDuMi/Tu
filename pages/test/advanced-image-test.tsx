import { useState, useEffect } from 'react'
import Head from 'next/head'
import { AdvancedImage, AdvancedAvatar, AdvancedCover } from '@/components/ui/AdvancedImage'
import { useImageLazyLoading, useImagePreloading, useImageDimensions } from '@/hooks/useImageLazyLoading'
import { generateOptimizedImageUrl, getOptimalQuality, ImagePerformanceMonitor } from '@/lib/image-optimization'

const testImages = [
  {
    id: 'avatar-1',
    name: '用户头像 1',
    src: 'https://picsum.photos/200/200?random=1',
    type: 'avatar'
  },
  {
    id: 'avatar-2',
    name: '用户头像 2',
    src: 'https://picsum.photos/200/200?random=2',
    type: 'avatar'
  },
  {
    id: 'cover-1',
    name: '封面图片 1',
    src: 'https://picsum.photos/800/450?random=3',
    type: 'cover'
  },
  {
    id: 'cover-2',
    name: '封面图片 2',
    src: 'https://picsum.photos/800/450?random=4',
    type: 'cover'
  },
  {
    id: 'gallery-1',
    name: '画廊图片 1',
    src: 'https://picsum.photos/600/400?random=5',
    type: 'gallery'
  },
  {
    id: 'gallery-2',
    name: '画廊图片 2',
    src: 'https://picsum.photos/600/400?random=6',
    type: 'gallery'
  }
]

export default function AdvancedImageTest() {
  const [enableLazyLoading, setEnableLazyLoading] = useState(true)
  const [compressionQuality, setCompressionQuality] = useState(75)
  const [enablePreloading, setEnablePreloading] = useState(false)
  const [performanceData, setPerformanceData] = useState<any>(null)

  // 图片预加载
  const { loadedImages, isLoading: preloading } = useImagePreloading(
    testImages.map(img => img.src),
    enablePreloading
  )

  // 性能监控
  useEffect(() => {
    const monitor = ImagePerformanceMonitor.getInstance()
    const interval = setInterval(() => {
      setPerformanceData(monitor.getMetrics())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const optimalQuality = getOptimalQuality()

  return (
    <>
      <Head>
        <title>高级图片组件测试</title>
        <meta name="description" content="测试高级图片组件的懒加载、压缩和优化功能" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* 页面标题和控制面板 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              高级图片组件测试
            </h1>

            {/* 控制面板 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">控制面板</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    压缩质量: {compressionQuality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={compressionQuality}
                    onChange={(e) => setCompressionQuality(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* 性能信息 */}
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">性能信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">最佳质量:</span>
                    <span className="ml-2 font-mono">{optimalQuality}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">预加载状态:</span>
                    <span className="ml-2">{preloading ? '加载中...' : '完成'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">已加载图片:</span>
                    <span className="ml-2 font-mono">{loadedImages.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">平均加载时间:</span>
                    <span className="ml-2 font-mono">
                      {performanceData?.averageLoadTime?.toFixed(0) || 0}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 头像测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">头像组件测试</h2>
            <div className="flex items-center space-x-6">
              {testImages.filter(img => img.type === 'avatar').map((image) => (
                <div key={image.id} className="text-center">
                  <AdvancedAvatar
                    src={image.src}
                    alt={image.name}
                    size={80}
                    fallbackText={image.name.charAt(0)}
                    enableLazyLoading={enableLazyLoading}
                    compressionQuality={compressionQuality}
                    onLoadComplete={() => {
                      const monitor = ImagePerformanceMonitor.getInstance()
                      monitor.recordLoadTime(image.src, Date.now())
                    }}
                  />
                  <p className="text-sm text-gray-600 mt-2">{image.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 封面图片测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">封面图片测试</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testImages.filter(img => img.type === 'cover').map((image) => (
                <div key={image.id}>
                  <AdvancedCover
                    src={image.src}
                    alt={image.name}
                    aspectRatio="16/9"
                    enableLazyLoading={enableLazyLoading}
                    compressionQuality={compressionQuality}
                    placeholder="blur"
                    onLoadComplete={() => {
                      const monitor = ImagePerformanceMonitor.getInstance()
                      monitor.recordLoadTime(image.src, Date.now())
                    }}
                  />
                  <h3 className="font-medium mt-2">{image.name}</h3>
                  <ImageDimensionsDisplay src={image.src} />
                </div>
              ))}
            </div>
          </div>

          {/* 画廊测试 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">画廊图片测试</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testImages.filter(img => img.type === 'gallery').map((image) => (
                <div key={image.id}>
                  <AdvancedImage
                    src={image.src}
                    alt={image.name}
                    width={400}
                    height={300}
                    enableLazyLoading={enableLazyLoading}
                    compressionQuality={compressionQuality}
                    showLoading={true}
                    retryCount={3}
                    className="rounded-lg"
                    onLoadComplete={() => {
                      const monitor = ImagePerformanceMonitor.getInstance()
                      monitor.recordLoadTime(image.src, Date.now())
                    }}
                  />
                  <h3 className="font-medium mt-2">{image.name}</h3>
                  <p className="text-sm text-gray-500">
                    优化URL: {typeof window !== 'undefined' ? generateOptimizedImageUrl(image.src, {
                      quality: compressionQuality,
                      width: 400,
                      height: 300
                    }).substring(0, 50) + '...' : '服务端渲染中...'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 懒加载演示 */}
          <LazyLoadingDemo enableLazyLoading={enableLazyLoading} />

          {/* 性能统计 */}
          {performanceData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">性能统计</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">总体统计</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>总图片数: {performanceData.totalImages}</div>
                    <div>平均加载时间: {performanceData.averageLoadTime.toFixed(0)}ms</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">优化效果</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>懒加载: {enableLazyLoading ? '启用' : '禁用'}</div>
                    <div>压缩质量: {compressionQuality}%</div>
                    <div>预加载: {enablePreloading ? '启用' : '禁用'}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">建议</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>当前网络条件下建议质量: {optimalQuality}%</p>
                    <p>已预加载图片: {loadedImages.size}/{testImages.length}</p>
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

// 图片尺寸显示组件
function ImageDimensionsDisplay({ src }: { src: string }) {
  const { dimensions, loading, error } = useImageDimensions(src)

  if (loading) return <p className="text-xs text-gray-500">检测尺寸中...</p>
  if (error) return <p className="text-xs text-red-500">尺寸检测失败</p>
  if (!dimensions) return null

  return (
    <p className="text-xs text-gray-500">
      {dimensions.width} × {dimensions.height} (比例: {dimensions.aspectRatio.toFixed(2)})
    </p>
  )
}

// 懒加载演示组件
function LazyLoadingDemo({ enableLazyLoading }: { enableLazyLoading: boolean }) {
  const { isInView, ref } = useImageLazyLoading({
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
            <AdvancedImage
              src="https://picsum.photos/400/300?random=99"
              alt="懒加载测试图片"
              width={400}
              height={300}
              className="rounded"
            />
          ) : (
            <div className="w-96 h-64 bg-gray-200 rounded flex items-center justify-center">
              <p className="text-gray-500">图片将在进入视口时加载</p>
            </div>
          )}
        </div>
        <div className="h-80 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">懒加载演示区域</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        状态: {isInView ? '已进入视口，图片已加载' : '未进入视口'}
      </p>
    </div>
  )
}
