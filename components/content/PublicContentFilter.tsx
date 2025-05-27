import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { fetcher } from '@/lib/api'

interface PublicContentFilterProps {
  filters: {
    category: string
    tag: string
    sort: string
    keyword?: string
    timeRange?: string
  }
  onFilterChange: (filters: any) => void
  showKeywordSearch?: boolean
  showTimeRange?: boolean
}

export function PublicContentFilter({
  filters,
  onFilterChange,
  showKeywordSearch = false,
  showTimeRange = false
}: PublicContentFilterProps) {
  const router = useRouter()
  const [keyword, setKeyword] = useState(filters.keyword || '')
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  // 获取分类列表
  const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useSWR(
    '/api/v1/categories?limit=100', // 获取更多分类
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟内不重复请求
      errorRetryCount: 3, // 错误重试次数
      fallbackData: { success: true, data: { items: [] } }, // 默认数据
    }
  )

  // 获取标签列表
  const { data: tagsData, error: tagsError, isLoading: tagsLoading } = useSWR(
    '/api/v1/tags?limit=100', // 获取更多标签
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟内不重复请求
      errorRetryCount: 3, // 错误重试次数
      fallbackData: { success: true, data: { items: [] } }, // 默认数据
    }
  )

  // 安全地获取数据，确保是数组
  const categories = Array.isArray(categoriesData?.data?.items)
    ? categoriesData?.data?.items
    : []

  const tags = Array.isArray(tagsData?.data?.items)
    ? tagsData?.data?.items
    : []

  // 排序选项
  const sortOptions = [
    { value: 'newest', label: '最新发布' },
    { value: 'popular', label: '最多浏览' },
    { value: 'trending', label: '热门推荐' },
    { value: 'most_liked', label: '最多点赞' },
    { value: 'most_commented', label: '最多评论' },
    { value: 'featured', label: '精选推荐' },
    { value: 'home_featured', label: '首页精选' },
    { value: 'home_latest', label: '首页近期流出' },
    { value: 'home_archive', label: '首页往期补档' },
    { value: 'home_trending', label: '首页热门推荐' },
  ]

  // 时间范围选项
  const timeRangeOptions = [
    { value: '', label: '全部时间' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '今年' },
  ]

  // 处理筛选条件变化
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ [key]: value })
  }

  // 处理关键词搜索
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setKeyword(value)

    // 防抖处理，500ms后才触发搜索
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    searchTimeout.current = setTimeout(() => {
      onFilterChange({ keyword: value })
    }, 500)
  }

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
      onFilterChange({ keyword })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      {/* 关键词搜索 */}
      {showKeywordSearch && (
        <div className="mb-4">
          <label htmlFor="keyword-search" className="block text-sm font-medium text-gray-700 mb-1">
            关键词搜索
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="keyword-search"
              className="block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              placeholder="搜索标题、内容..."
              value={keyword}
              onChange={handleKeywordChange}
              onKeyPress={handleKeyPress}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 分类筛选 */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <select
            id="category-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 标签筛选 */}
        <div>
          <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">
            标签
          </label>
          <select
            id="tag-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filters.tag}
            onChange={(e) => handleFilterChange('tag', e.target.value)}
          >
            <option value="">全部标签</option>
            {tags.map((tag: any) => (
              <option key={tag.id} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        {/* 排序方式 */}
        <div>
          <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">
            排序方式
          </label>
          <select
            id="sort-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 时间范围筛选 */}
      {showTimeRange && (
        <div className="mt-4">
          <label htmlFor="time-range-filter" className="block text-sm font-medium text-gray-700 mb-1">
            时间范围
          </label>
          <select
            id="time-range-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={filters.timeRange || ''}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 活跃筛选条件标签 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.keyword && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            关键词: {filters.keyword}
            <button
              type="button"
              className="ml-1 text-primary-600 hover:text-primary-800"
              onClick={() => handleFilterChange('keyword', '')}
            >
              <span className="sr-only">移除筛选</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {filters.category && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            分类: {categories.find((c: any) => c.slug === filters.category)?.name || filters.category}
            <button
              type="button"
              className="ml-1 text-primary-600 hover:text-primary-800"
              onClick={() => handleFilterChange('category', '')}
            >
              <span className="sr-only">移除筛选</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {filters.tag && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            标签: {tags.find((t: any) => t.slug === filters.tag)?.name || filters.tag}
            <button
              type="button"
              className="ml-1 text-primary-600 hover:text-primary-800"
              onClick={() => handleFilterChange('tag', '')}
            >
              <span className="sr-only">移除筛选</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {filters.timeRange && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            时间: {timeRangeOptions.find(t => t.value === filters.timeRange)?.label || filters.timeRange}
            <button
              type="button"
              className="ml-1 text-primary-600 hover:text-primary-800"
              onClick={() => handleFilterChange('timeRange', '')}
            >
              <span className="sr-only">移除筛选</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {(filters.category || filters.tag || filters.keyword || filters.timeRange) && (
          <button
            type="button"
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => onFilterChange({ category: '', tag: '', keyword: '', timeRange: '' })}
          >
            清除全部筛选
          </button>
        )}
      </div>
    </div>
  )
}

// 为了向后兼容性，保留默认导出
export default PublicContentFilter;
