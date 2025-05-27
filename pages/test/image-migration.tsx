import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'

interface TestImageData {
  id: string
  name: string
  src: string
  description: string
  category: 'avatar' | 'cover' | 'media' | 'static'
}

const testImages: TestImageData[] = [
  {
    id: 'avatar-1',
    name: '用户头像 - 正常',
    src: 'https://picsum.photos/200/200?random=1',
    description: '正常的用户头像图片',
    category: 'avatar'
  },
  {
    id: 'avatar-2',
    name: '用户头像 - 另一个',
    src: 'https://picsum.photos/200/200?random=6',
    description: '另一个用户头像图片',
    category: 'avatar'
  },
  {
    id: 'cover-1',
    name: '封面图片 - 横版',
    src: 'https://picsum.photos/800/450?random=2',
    description: '16:9比例的封面图片',
    category: 'cover'
  },
  {
    id: 'cover-2',
    name: '封面图片 - 风景',
    src: 'https://picsum.photos/800/450?random=7',
    description: '另一张16:9比例的封面图片',
    category: 'cover'
  },
  {
    id: 'media-1',
    name: '媒体预览 - 大图',
    src: 'https://picsum.photos/600/400?random=4',
    description: '高分辨率媒体图片',
    category: 'media'
  },
  {
    id: 'media-2',
    name: '媒体预览 - 小图',
    src: 'https://picsum.photos/400/300?random=5',
    description: '中等分辨率媒体图片',
    category: 'media'
  }
]

export default function ImageMigrationTest() {
  const router = useRouter()
  const [useOptimized, setUseOptimized] = useState(true)
  const [loadTimes, setLoadTimes] = useState<Record<string, number>>({})

  // 从URL参数读取测试模式
  useEffect(() => {
    const { optimized } = router.query
    if (optimized !== undefined) {
      setUseOptimized(optimized === 'true')
    }
  }, [router.query])

  const handleImageLoad = (imageId: string, startTime: number) => {
    const loadTime = Date.now() - startTime
    setLoadTimes(prev => ({ ...prev, [imageId]: loadTime }))
  }

  const toggleMode = () => {
    const newMode = !useOptimized
    setUseOptimized(newMode)
    router.push(`/test/image-migration?optimized=${newMode}`, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>图片组件迁移测试</title>
        <meta name="description" content="Next.js Image vs 原生img标签性能对比测试" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题和控制面板 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              图片组件迁移测试
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={toggleMode}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useOptimized
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                当前模式: {useOptimized ? 'Next.js Image (优化)' : '原生 img (当前)'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                重新加载页面
              </button>
            </div>

            <p className="text-gray-600">
              点击切换按钮可以在Next.js Image组件和原生img标签之间切换，对比加载性能和显示效果。
            </p>
          </div>

          {/* 基础测试内容 */}
          <div className="space-y-8">
            {/* 头像测试 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">头像图片测试</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {testImages.filter(img => img.category === 'avatar').map((image) => {
                  const startTime = Date.now()
                  return (
                    <div key={image.id} className="text-center">
                      <div className="mb-3">
                        {useOptimized ? (
                          <Image
                            src={image.src}
                            alt={image.name}
                            width={80}
                            height={80}
                            className="rounded-full object-cover mx-auto"
                            onLoad={() => handleImageLoad(image.id, startTime)}
                          />
                        ) : (
                          <img
                            src={image.src}
                            alt={image.name}
                            className="w-20 h-20 rounded-full object-cover mx-auto"
                            onLoad={() => handleImageLoad(image.id, startTime)}
                          />
                        )}
                      </div>
                      <h4 className="font-medium text-sm">{image.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{image.description}</p>
                      {loadTimes[image.id] && (
                        <p className="text-xs text-blue-600 mt-1">
                          加载时间: {loadTimes[image.id]}ms
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 封面图片测试 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">封面图片测试</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testImages.filter(img => img.category === 'cover').map((image) => {
                  const startTime = Date.now()
                  return (
                    <div key={image.id}>
                      <div className="mb-3">
                        {useOptimized ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            <Image
                              src={image.src}
                              alt={image.name}
                              fill
                              className="object-cover"
                              onLoad={() => handleImageLoad(image.id, startTime)}
                            />
                          </div>
                        ) : (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            <img
                              src={image.src}
                              alt={image.name}
                              className="w-full h-full object-cover"
                              onLoad={() => handleImageLoad(image.id, startTime)}
                            />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium">{image.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{image.description}</p>
                      {loadTimes[image.id] && (
                        <p className="text-sm text-blue-600 mt-1">
                          加载时间: {loadTimes[image.id]}ms
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 性能统计 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">性能统计</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">图片加载时间</h4>
                  <div className="mt-2 space-y-1">
                    {Object.entries(loadTimes).map(([imageId, time]) => (
                      <div key={imageId} className="text-sm">
                        <span className="text-gray-600">{imageId}:</span>
                        <span className="ml-2 font-mono">{time}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">当前设置</h4>
                  <div className="mt-2 text-sm space-y-1">
                    <div>优化模式: {useOptimized ? '启用' : '禁用'}</div>
                    <div>测试图片: {testImages.length} 张</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">说明</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>切换模式观察加载时间和显示效果的差异</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
