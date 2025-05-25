import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { PageTitle } from '@/components/ui/PageTitle'
import { ContentGridSkeleton } from '@/components/ui/LoadingSpinner'
import { NoSearchResults, ErrorState } from '@/components/ui/EmptyState'
import { fetcher } from '@/lib/api'
import PublicLayout from '@/components/layout/PublicLayout'
import ContentCard from '@/components/content/ContentCard'
import PublicContentFilter from '@/components/content/PublicContentFilter'

interface SearchPageProps {
  initialContents: any
}

export default function SearchPage({ initialContents }: SearchPageProps) {
  const router = useRouter()
  const { q, category, tag, sort, page: pageParam, timeRange } = router.query

  const [currentPage, setCurrentPage] = useState(pageParam ? Number(pageParam) : 1)
  const [pageSize, setPageSize] = useState(12)
  const [filters, setFilters] = useState({
    keyword: (q as string) || '',
    category: (category as string) || '',
    tag: (tag as string) || '',
    sort: (sort as string) || 'newest',
    timeRange: (timeRange as string) || '',
  })

  // 当URL参数变化时更新筛选条件
  useEffect(() => {
    setFilters({
      keyword: (q as string) || '',
      category: (category as string) || '',
      tag: (tag as string) || '',
      sort: (sort as string) || 'newest',
      timeRange: (timeRange as string) || '',
    })
    setCurrentPage(pageParam ? Number(pageParam) : 1)
  }, [q, category, tag, sort, pageParam, timeRange])

  // 构建查询参数
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: pageSize.toString(),
    ...(filters.keyword ? { q: filters.keyword } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
    ...(filters.timeRange ? { timeRange: filters.timeRange } : {}),
  })

  // 使用SWR获取内容列表
  const { data: contentsData, error: contentsError, isLoading } = useSWR(
    `/api/v1/pages?${queryParams.toString()}`,
    fetcher,
    {
      fallbackData: initialContents,
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30秒内不重复请求
    }
  )

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)

    // 更新URL，保留其他查询参数
    const newQuery = {
      ...router.query,
      page: page.toString(),
    }

    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 处理筛选条件变化
  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setCurrentPage(1) // 重置页码

    // 检查是否是标签搜索
    if (updatedFilters.keyword && updatedFilters.keyword.startsWith('#')) {
      // 如果是标签搜索，提取标签名并设置tag参数
      const tagName = updatedFilters.keyword.substring(1)
      updatedFilters.tag = tagName
      updatedFilters.keyword = ''
    }

    // 更新URL
    const newQuery: any = {}
    if (updatedFilters.keyword) newQuery.q = updatedFilters.keyword
    if (updatedFilters.category) newQuery.category = updatedFilters.category
    if (updatedFilters.tag) newQuery.tag = updatedFilters.tag
    if (updatedFilters.sort) newQuery.sort = updatedFilters.sort
    if (updatedFilters.timeRange) newQuery.timeRange = updatedFilters.timeRange

    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true })
  }

  // 计算分页信息
  const pagination = contentsData?.data?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  }

  // 获取内容列表
  const contents = contentsData?.data?.items || []

  return (
    <PublicLayout
      title={`${filters.keyword ? `"${filters.keyword}" 的搜索结果` : '搜索内容'} - 兔图内容平台`}
      description={`搜索兔图内容平台上的内容 - ${filters.keyword || '全部内容'}`}
      keywords={["内容搜索", "知识分享", "社区平台"]}
    >
      <PageTitle
        title="内容搜索"
        description="搜索您感兴趣的内容，发现更多可能"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            {filters.keyword ? `"${filters.keyword}" 的搜索结果` : '搜索内容'}
          </h1>
          {pagination.total > 0 && (
            <p className="mt-2 text-gray-600 dark:text-dark-muted">
              找到 {pagination.total} 条相关内容
            </p>
          )}
        </div>

        {/* 搜索框 */}
        <div className="mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilterChange({ keyword: filters.keyword });
            }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                placeholder="搜索内容或标签..."
                className="w-full px-6 py-4 pl-14 pr-32 rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-dark-text text-lg transition-all duration-200 hover:shadow-md"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-gray-400 dark:text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="hidden sm:flex items-center text-sm text-gray-500 dark:text-dark-muted mr-3">
                  <span className="bg-gray-100 dark:bg-dark-border px-2 py-1 rounded text-xs">#标签</span>
                </div>
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors duration-200 text-sm font-medium"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500 dark:text-dark-muted mb-3 block">热门标签</span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleFilterChange({ tag: '最新', keyword: '' })}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-200 border border-blue-200 dark:border-blue-700/50"
              >
                #最新
              </button>
              <button
                onClick={() => handleFilterChange({ tag: '推荐', keyword: '' })}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-200 border border-purple-200 dark:border-purple-700/50"
              >
                #推荐
              </button>
              <button
                onClick={() => handleFilterChange({ tag: '热门', keyword: '' })}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 transition-all duration-200 border border-red-200 dark:border-red-700/50"
              >
                #热门
              </button>
              <button
                onClick={() => handleFilterChange({ tag: '教程', keyword: '' })}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-300 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-200 border border-green-200 dark:border-green-700/50"
              >
                #教程
              </button>
            </div>
          </div>
        </div>

        {/* 筛选器 */}
        <PublicContentFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          showKeywordSearch={false}
          showTimeRange={true}
        />

        {/* 内容列表 */}
        {isLoading ? (
          <ContentGridSkeleton count={12} />
        ) : contentsError ? (
          <ErrorState
            title="加载内容失败"
            description="请检查网络连接或稍后重试"
            onRetry={() => router.reload()}
          />
        ) : contents.length === 0 ? (
          <NoSearchResults
            keyword={filters.keyword}
            onReset={() => {
              setFilters({
                keyword: '',
                category: '',
                tag: '',
                sort: 'newest',
                timeRange: ''
              })
              router.push('/search')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {contents.map((content: any) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { q, category, tag, sort, page = '1', timeRange } = context.query

  try {
    // 构建查询参数
    const queryParams = new URLSearchParams({
      page: page as string,
      limit: '12',
      ...(q ? { q: q as string } : {}),
      ...(category ? { category: category as string } : {}),
      ...(tag ? { tag: tag as string } : {}),
      ...(sort ? { sort: sort as string } : { sort: 'newest' }),
      ...(timeRange ? { timeRange: timeRange as string } : {}),
    })

    // 获取内容列表
    const contentsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/pages?${queryParams.toString()}`
    )
    const contentsData = await contentsResponse.json()

    return {
      props: {
        initialContents: contentsData,
      },
    }
  } catch (error) {
    console.error('获取搜索结果失败:', error)

    return {
      props: {
        initialContents: {
          success: true,
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 12,
              total: 0,
              totalPages: 0,
            },
          },
        },
      },
    }
  }
}
