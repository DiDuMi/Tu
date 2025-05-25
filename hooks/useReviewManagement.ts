import { useState, useEffect } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { useContentStore } from '@/stores/contentStore'
import { Page } from '@/stores/contentStore'

/**
 * 审核管理自定义Hook
 * 用于管理内容审核相关的状态和操作
 */
export function useReviewManagement() {
  const [mounted, setMounted] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)

  // 从状态管理中获取内容列表状态
  const {
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    setPages,
    setTotalPages,
    setCurrentPage,
    setPageSize,
    setIsLoading,
    setError,
    setSearchTerm,
  } = useContentStore()

  // 构建API URL
  const buildApiUrl = () => {
    // 创建URL参数对象
    const params = new URLSearchParams();

    // 添加必要的参数
    params.append('page', currentPage.toString());
    params.append('limit', pageSize.toString());

    // 添加可选参数
    if (searchTerm) params.append('search', searchTerm);

    const url = `/api/v1/content/review?${params.toString()}`;
    console.log('内容审核API URL:', url);
    return url;
  };

  // 获取待审核内容列表
  const { data, mutate: refreshPages } = useFetch<{ success: boolean, data: { items: Page[], pagination: any } }>(
    mounted ? buildApiUrl() : null,
    {
      onSuccess: (data) => {
        console.log('内容审核列表获取成功:', data);
        if (data?.success) {
          setPages(data.data.items)
          setTotalPages(data.data.pagination.total)
          setIsLoading(false)
        }
      },
      onError: (error) => {
        console.error('内容审核列表获取失败:', error);
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

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 处理搜索词变化
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // 重置页码
  }

  // 打开审核模态框
  const handleReviewPage = (page: Page) => {
    setSelectedPage(page)
    setReviewModalOpen(true)
  }

  // 处理模态框关闭
  const handleModalClose = () => {
    setReviewModalOpen(false)
    setSelectedPage(null)
  }

  // 处理操作成功
  const handleSuccess = () => {
    refreshPages()
  }

  return {
    mounted,
    reviewModalOpen,
    selectedPage,
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    handlePageChange,
    handleSearchChange,
    handleReviewPage,
    handleModalClose,
    handleSuccess,
  }
}
