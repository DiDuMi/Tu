import { useState, useMemo } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { fetcher } from '@/lib/api'
import MainLayout from '@/components/layout/MainLayout'
import { formatDate, formatDateTime } from '@/lib/utils'
import { smartSanitizeFilename } from '@/lib/filename-utils-flexible'

// 媒体类型标签组件
const MediaTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { label: string; className: string }> = {
    IMAGE: {
      label: '图片',
      className: 'bg-blue-100 text-blue-800',
    },
    VIDEO: {
      label: '视频',
      className: 'bg-purple-100 text-purple-800',
    },
    AUDIO: {
      label: '音频',
      className: 'bg-green-100 text-green-800',
    },
    DOCUMENT: {
      label: '文档',
      className: 'bg-yellow-100 text-yellow-800',
    },
    OTHER: {
      label: '其他',
      className: 'bg-gray-100 text-gray-800',
    },
  }

  const { label, className } = typeMap[type] || typeMap.OTHER

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

export default function MediaDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()

  // 获取媒体详情
  const { data: mediaData, error } = useSWR(
    id ? `/api/v1/media/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const media = mediaData?.data

  // 获取相关媒体
  const { data: relatedMediaData } = useSWR(
    media ? `/api/v1/media/related?excludeId=${id}&limit=6${
      media.categoryId ? `&categoryId=${media.categoryId}` : ''
    }` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const relatedMedia = relatedMediaData?.data || []

  // 生成安全的媒体URL
  const safeMediaUrl = useMemo(() => {
    if (!media?.url) return ''

    // 检查URL是否已经是完整的HTTP URL
    if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
      return media.url
    }

    // 对相对路径进行安全编码
    return getSafeMediaUrl(`public${media.url}`)
  }, [media?.url])

  // 生成安全的缩略图URL
  const safeThumbnailUrl = useMemo(() => {
    if (!media?.thumbnail) return undefined

    if (media.thumbnail.startsWith('http://') || media.thumbnail.startsWith('https://')) {
      return media.thumbnail
    }

    return getSafeMediaUrl(`public${media.thumbnail}`)
  }, [media?.thumbnail])

  // 处理下载
  const handleDownload = () => {
    if (!media) return

    // 创建一个临时链接并触发下载
    const link = document.createElement('a')
    link.href = safeMediaUrl || media.url
    link.download = media.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <MainLayout title="媒体不存在 - 兔图">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">媒体不存在或已被删除</h1>
            <Link href="/media">
              <Button>返回媒体库</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!mediaData) {
    return (
      <MainLayout title="加载中... - 兔图">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      title={`${media.name} - 兔图媒体库`}
      description={media.description || `查看${media.name}的详细信息`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/media" className="text-primary-600 hover:text-primary-700">
            &larr; 返回媒体库
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 媒体预览 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {media.type === 'IMAGE' ? (
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <img
                        src={safeMediaUrl}
                        alt={media.name}
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={(e) => {
                          console.error('图片加载失败:', safeMediaUrl)
                          // 降级到原始URL
                          e.currentTarget.src = media.url
                        }}
                      />
                    </div>
                  ) : media.type === 'VIDEO' ? (
                    <video
                      src={safeMediaUrl}
                      controls
                      className="w-full"
                      poster={safeThumbnailUrl}
                      onError={(e) => {
                        console.error('视频加载失败:', safeMediaUrl)
                        // 降级到原始URL
                        e.currentTarget.src = media.url
                      }}
                    >
                      您的浏览器不支持视频播放
                    </video>
                  ) : media.type === 'AUDIO' ? (
                    <div className="p-8 flex justify-center">
                      <audio
                        src={safeMediaUrl}
                        controls
                        className="w-full"
                        onError={(e) => {
                          console.error('音频加载失败:', safeMediaUrl)
                          // 降级到原始URL
                          e.currentTarget.src = media.url
                        }}
                      >
                        您的浏览器不支持音频播放
                      </audio>
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-24 w-24 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="mt-4 text-gray-500">
                        此文件类型无法在浏览器中预览
                      </p>
                      <Button onClick={handleDownload} className="mt-4">
                        下载文件
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 媒体信息 */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{media.name}</h1>

                <div className="flex items-center mb-4">
                  <MediaTypeBadge type={media.type} />
                  {media.fileSize && (
                    <span className="ml-2 text-sm text-gray-500">
                      {(media.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>

                {media.description && (
                  <div className="mb-4">
                    <h2 className="text-sm font-medium text-gray-700 mb-1">描述</h2>
                    <p className="text-gray-600">{media.description}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-sm font-medium text-gray-700 mb-1">上传者</h2>
                  <div className="flex items-center">
                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                      {media.user?.image ? (
                        <img
                          src={media.user.image}
                          alt={media.user.name || '用户头像'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                          {media.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {media.user?.name || '匿名用户'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-sm font-medium text-gray-700 mb-1">上传时间</h2>
                  <p className="text-gray-600">{formatDateTime(media.createdAt)}</p>
                </div>

                {media.category && (
                  <div className="mb-4">
                    <h2 className="text-sm font-medium text-gray-700 mb-1">分类</h2>
                    <Link
                      href={`/media?categoryId=${media.category.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {media.category.name}
                    </Link>
                  </div>
                )}

                {media.mediaTags && media.mediaTags.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-sm font-medium text-gray-700 mb-1">标签</h2>
                    <div className="flex flex-wrap gap-2">
                      {media.mediaTags.map((mediaTag: any) => (
                        <Link
                          key={mediaTag.tag.id}
                          href={`/media?tagId=${mediaTag.tag.id}`}
                          className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs hover:bg-gray-200"
                        >
                          {mediaTag.tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 mt-6">
                  <Button onClick={handleDownload} className="flex-1">
                    下载
                  </Button>
                  {session && (
                    <Button variant="outline" className="flex-1">
                      收藏
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 相关媒体 */}
        {relatedMedia.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">相关媒体</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMedia.map((item: any) => (
                <Link key={item.id} href={`/media/${item.uuid}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                    <div className="relative aspect-square bg-gray-100">
                      {item.type === 'IMAGE' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          {item.type === 'VIDEO' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {item.type === 'AUDIO' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          )}
                          {item.type === 'DOCUMENT' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {item.type === 'OTHER' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          )}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <MediaTypeBadge type={item.type} />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取会话信息，但不强制登录
  const session = await getServerSession(context.req, context.res, authOptions)

  return {
    props: {},
  }
}
