import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useFetch } from '@/hooks/useFetch'
import { useContentStore, Page, Category, Tag } from '@/stores/contentStore'

/**
 * 内容管理自定义Hook
 * 用于管理内容列表相关的状态和操作
 */
export function useContentManagement() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)

  // 从URL获取查询参数
  const { categoryId: queryCategoryId, tagId: queryTagId, status: queryStatus } = router.query

  // 从状态管理中获取内容列表状态
  const {
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    statusFilter: status,
    categoryFilter: categoryId,
    tagFilter: tagId,
    sortField: sortBy,
    sortDirection,
    setPages,
    setTotalPages,
    setCurrentPage,
    setPageSize,
    setIsLoading,
    setError,
    setSearchTerm,
    setStatusFilter: setStatus,
    setCategoryFilter: setCategoryId,
    setTagFilter: setTagId,
    setSortField: setSortBy,
    setSortDirection,
  } = useContentStore()

  // 获取分类列表
  const { data: categoriesData } = useFetch<{ success: boolean, data: { items: Category[] } }>(
    mounted ? '/api/v1/categories?limit=100' : null
  )

  // 获取标签列表
  const { data: tagsData } = useFetch<{ success: boolean, data: { items: Tag[] } }>(
    mounted ? '/api/v1/tags?limit=100' : null
  )

  // 构建API URL
  const buildApiUrl = () => {
    // 创建URL参数对象
    const params = new URLSearchParams();

    // 添加必要的参数
    params.append('page', currentPage.toString());
    params.append('limit', pageSize.toString());

    // 添加可选参数
    if (searchTerm) params.append('search', searchTerm);
    if (status) params.append('status', status);
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (tagId) params.append('tagIds', tagId.toString());
    params.append('sortField', sortBy || 'createdAt');
    params.append('sortDirection', sortDirection || 'desc');

    const url = `/api/v1/content?${params.toString()}`;
    console.log('内容管理API URL:', url);
    return url;
  };

  // 获取内容列表
  const { data: pagesData, mutate: refreshPages } = useFetch<{ success: boolean, data: { items: Page[], pagination: any } }>(
    mounted ? buildApiUrl() : null,
    {
      onSuccess: (data) => {
        console.log('内容列表获取成功:', data);
        if (data?.success) {
          setPages(data.data.items)
          setTotalPages(data.data.pagination.total)
          setIsLoading(false)
        }
      },
      onError: (error) => {
        console.error('内容列表获取失败:', error);
        setError(error.message)
        setIsLoading(false)
      },
      // 禁用缓存，确保每次都从服务器获取最新数据
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
    }
  )

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 从URL查询参数初始化筛选条件
  useEffect(() => {
    if (mounted && router.isReady) {
      if (queryCategoryId) {
        setCategoryId(parseInt(queryCategoryId as string))
      }

      if (queryTagId) {
        setTagId(parseInt(queryTagId as string))
      }

      if (queryStatus) {
        setStatus(queryStatus as string)
      }
    }
  }, [mounted, router.isReady, queryCategoryId, queryTagId, queryStatus, setCategoryId, setTagId, setStatus])

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 处理搜索词变化
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // 重置页码
  }

  // 处理状态变化
  const handleStatusChange = (value: string) => {
    setStatus(value)
    setCurrentPage(1) // 重置页码
  }

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setCategoryId(value ? parseInt(value) : null)
    setCurrentPage(1) // 重置页码
  }

  // 处理标签变化
  const handleTagChange = (value: string) => {
    setTagId(value ? parseInt(value) : null)
    setCurrentPage(1) // 重置页码
  }

  // 处理排序字段变化
  const handleSortByChange = (value: string) => {
    setSortBy(value)
  }

  // 处理排序方向变化
  const handleSortDirectionChange = (value: string) => {
    setSortDirection(value as 'asc' | 'desc')
  }

  // 重置筛选条件
  const handleResetFilter = () => {
    setSearchTerm('')
    setStatus('')
    setCategoryId(null)
    setTagId(null)
    setSortBy('createdAt')
    setSortDirection('desc')
    setCurrentPage(1)
  }

  // 打开删除模态框
  const handleDeletePage = (page: Page) => {
    setSelectedPage(page)
    setDeleteModalOpen(true)
  }

  // 处理模态框关闭
  const handleModalClose = () => {
    setDeleteModalOpen(false)
    setSelectedPage(null)
  }

  // 处理操作成功
  const handleSuccess = () => {
    refreshPages()
  }

  return {
    mounted,
    deleteModalOpen,
    selectedPage,
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    status,
    categoryId,
    tagId,
    sortBy,
    sortDirection,
    categories: categoriesData?.success ? (categoriesData.data as any)?.items || categoriesData.data || [] : [],
    tags: tagsData?.success ? (tagsData.data as any)?.items || tagsData.data || [] : [],
    handlePageChange,
    handleSearch,
    handleStatusChange,
    handleCategoryChange,
    handleTagChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleResetFilter,
    handleDeletePage,
    handleModalClose,
    handleSuccess,
    // 添加缺失的函数
    setTagId,
    setCategoryId,
    setStatus,
  }
}
