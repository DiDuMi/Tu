import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Pagination } from '@/components/ui/Pagination'
import { useUserStore } from '@/stores/userStore'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ContentCard from '@/components/content/ContentCard'
import PublicContentFilter from '@/components/content/PublicContentFilter'

export default function LikesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    tag: '',
    sort: 'newest',
  })

  const {
    likedContents,
    isLikesLoading,
    error,
    fetchLikedContents,
    toggleLike
  } = useUserStore()

  // 当用户登录状态变化时，获取点赞列表
  useEffect(() => {
    if (session) {
      fetchLikedContents()
    }
  }, [session, fetchLikedContents])

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 处理筛选条件变化
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // 重置页码
  }

  // 处理取消点赞
  const handleUnlike = async (contentId: string) => {
    try {
      const result = await toggleLike(contentId)
      if (!result.isLiked) {
        // 如果成功取消点赞，不需要额外操作，因为store已经更新了状态
      }
    } catch (error) {
      console.error('取消点赞失败:', error)
    }
  }

  // 筛选点赞内容
  const filteredLikes = likedContents.filter(item => {
    // 关键词筛选
    if (filters.keyword && !item.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
      return false
    }

    // 分类筛选
    if (filters.category && item.category?.slug !== filters.category) {
      return false
    }

    // 标签筛选
    if (filters.tag && !item.tags?.some(tag => tag.slug === filters.tag)) {
      return false
    }

    return true
  })

  // 排序点赞内容
  const sortedLikes = [...filteredLikes].sort((a, b) => {
    switch (filters.sort) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'popular':
        return b.viewCount - a.viewCount
      case 'most_liked':
        return (b.likeCount || 0) - (a.likeCount || 0)
      case 'most_commented':
        return (b.commentCount || 0) - (a.commentCount || 0)
      default:
        return new Date(b.likedAt || b.createdAt).getTime() - new Date(a.likedAt || a.createdAt).getTime()
    }
  })

  // 分页
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedLikes = sortedLikes.slice(startIndex, endIndex)
  const totalPages = Math.ceil(sortedLikes.length / pageSize)

  // 如果用户未登录，重定向到登录页面
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/dashboard/likes')
    return null
  }

  return (
    <DashboardLayout>
      <Head>
        <title>我的点赞 - 兔图</title>
        <meta name="description" content="管理您在兔图内容管理平台上点赞的内容" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的点赞</h1>
          <p className="mt-2 text-gray-600">
            管理您点赞的内容，共 {filteredLikes.length} 项
          </p>
        </div>

        {/* 筛选器 */}
        <PublicContentFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          showKeywordSearch={true}
        />

        {/* 内容列表 */}
        {isLikesLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchLikedContents()}
            >
              重新加载
            </Button>
          </div>
        ) : paginatedLikes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">
              {filteredLikes.length === 0
                ? '您还没有点赞任何内容'
                : '没有符合筛选条件的点赞内容'}
            </p>
            {filteredLikes.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters({
                  keyword: '',
                  category: '',
                  tag: '',
                  sort: 'newest',
                })}
              >
                清除筛选条件
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {paginatedLikes.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onUnlike={() => handleUnlike(content.uuid)}
                showLikeButton={true}
                initialLiked={true}
              />
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  }
}
