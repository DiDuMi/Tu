import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { fetcher } from '@/lib/api'
import PublicLayout from '@/components/layout/PublicLayout'
import { formatDate } from '@/lib/utils'

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

export default function MediaLibraryPage() {
  const router = useRouter()
  const { data: session } = useSession()

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    categoryId: router.query.categoryId as string || '',
    tagId: router.query.tagId as string || '',
    type: router.query.type as string || '',
    keyword: router.query.keyword as string || '',
    page: parseInt(router.query.page as string || '1', 10),
  })

  // 处理筛选变化
  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)

    // 更新URL查询参数
    const query: any = {}
    if (updatedFilters.categoryId) query.categoryId = updatedFilters.categoryId
    if (updatedFilters.tagId) query.tagId = updatedFilters.tagId
    if (updatedFilters.type) query.type = updatedFilters.type
    if (updatedFilters.keyword) query.keyword = updatedFilters.keyword
    if (updatedFilters.page > 1) query.page = updatedFilters.page

    router.push({
      pathname: '/media',
      query,
    }, undefined, { shallow: true })
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })

    // 更新URL查询参数
    const query: any = { ...router.query, page: page > 1 ? page : undefined }
    if (page === 1) delete query.page

    router.push({
      pathname: '/media',
      query,
    }, undefined, { shallow: true })
  }

  // 获取媒体列表
  const { data: mediaData, error } = useSWR(
    `/api/v1/media?page=${filters.page}&limit=24${
      filters.categoryId ? `&categoryId=${filters.categoryId}` : ''
    }${filters.tagId ? `&tagId=${filters.tagId}` : ''}${
      filters.type ? `&type=${filters.type}` : ''
    }${filters.keyword ? `&keyword=${encodeURIComponent(filters.keyword)}` : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  const mediaItems = mediaData?.data?.items || []
  const totalItems = mediaData?.data?.pagination?.total || 0
  const totalPages = mediaData?.data?.pagination?.totalPages || 1

  // 获取媒体分类
  const { data: categoriesData } = useSWR(
    '/api/v1/media/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟内不重复请求
    }
  )

  const categories = categoriesData?.data?.items || []

  // 获取媒体标签
  const { data: tagsData } = useSWR(
    '/api/v1/media/tags',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟内不重复请求
    }
  )

  const tags = tagsData?.data?.items || []

  // 同步URL查询参数和状态
  useEffect(() => {
    const page = parseInt(router.query.page as string || '1', 10)
    const categoryId = router.query.categoryId as string || ''
    const tagId = router.query.tagId as string || ''
    const type = router.query.type as string || ''
    const keyword = router.query.keyword as string || ''

    if (
      page !== filters.page ||
      categoryId !== filters.categoryId ||
      tagId !== filters.tagId ||
      type !== filters.type ||
      keyword !== filters.keyword
    ) {
      setFilters({
        page,
        categoryId,
        tagId,
        type,
        keyword,
      })
    }
  }, [router.query])

  return (
    <PublicLayout
      title="媒体库 - 兔图内容平台"
      description="浏览兔图内容平台上的媒体资源"
      keywords={["媒体库", "图片", "视频", "音频", "文档"]}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">媒体库</h1>
            <p className="mt-1 text-gray-500">浏览和发现各种媒体资源</p>
          </div>

          <div className="mt-4 md:mt-0">
            {session && (
              <Link href="/dashboard/contents/create">
                <Button>上传媒体</Button>
              </Link>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 关键词搜索 */}
            <div>
              <input
                type="text"
                placeholder="搜索媒体..."
                value={filters.keyword}
                onChange={(e) => handleFilterChange({ keyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* 分类筛选 */}
            <div>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange({ categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">所有分类</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签筛选 */}
            <div>
              <select
                value={filters.tagId}
                onChange={(e) => handleFilterChange({ tagId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">所有标签</option>
                {tags.map((tag: any) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 类型筛选 */}
            <div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">所有类型</option>
                <option value="IMAGE">图片</option>
                <option value="VIDEO">视频</option>
                <option value="AUDIO">音频</option>
                <option value="DOCUMENT">文档</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
          </div>
        </div>

        {/* 媒体列表 */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">加载媒体时出错</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.reload()}
            >
              重试
            </Button>
          </div>
        ) : !mediaData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">加载媒体中...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无媒体</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.map((media: any) => (
              <Link key={media.id} href={`/media/${media.uuid}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  <div className="relative aspect-square bg-gray-100">
                    {media.type === 'IMAGE' ? (
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        {media.type === 'VIDEO' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        {media.type === 'AUDIO' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        )}
                        {media.type === 'DOCUMENT' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {media.type === 'OTHER' && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        )}
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <MediaTypeBadge type={media.type} />
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {media.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(media.createdAt)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取会话信息，但不强制登录
  const session = await getServerSession(context.req, context.res, authOptions)

  return {
    props: {},
  }
}
