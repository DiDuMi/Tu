import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { PaginationParams } from '@/types/api'

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  syncWithUrl?: boolean
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  syncWithUrl = false,
}: UsePaginationOptions = {}) {
  const router = useRouter()
  
  // 如果需要与URL同步，则从URL中获取初始值
  const getInitialValues = () => {
    if (syncWithUrl && router.isReady) {
      const pageFromUrl = router.query.page ? Number(router.query.page) : initialPage
      const limitFromUrl = router.query.limit ? Number(router.query.limit) : initialLimit
      return {
        page: isNaN(pageFromUrl) ? initialPage : pageFromUrl,
        limit: isNaN(limitFromUrl) ? initialLimit : limitFromUrl,
      }
    }
    return { page: initialPage, limit: initialLimit }
  }

  const [pagination, setPagination] = useState<PaginationParams>(getInitialValues)

  // 当路由准备好时，从URL更新分页状态
  useEffect(() => {
    if (syncWithUrl && router.isReady) {
      setPagination(getInitialValues())
    }
  }, [router.isReady, router.query.page, router.query.limit, syncWithUrl])

  const setPage = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }))
      
      if (syncWithUrl) {
        const query = { ...router.query, page: page.toString() }
        router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
      }
    },
    [router, syncWithUrl]
  )

  const setLimit = useCallback(
    (limit: number) => {
      setPagination((prev) => ({ ...prev, page: 1, limit })) // 更改每页数量时重置为第一页
      
      if (syncWithUrl) {
        const query = { ...router.query, page: '1', limit: limit.toString() }
        router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
      }
    },
    [router, syncWithUrl]
  )

  const reset = useCallback(() => {
    setPagination({ page: initialPage, limit: initialLimit })
    
    if (syncWithUrl) {
      const query = { ...router.query }
      delete query.page
      delete query.limit
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
    }
  }, [initialPage, initialLimit, router, syncWithUrl])

  return {
    page: pagination.page,
    limit: pagination.limit,
    setPage,
    setLimit,
    reset,
    paginationParams: pagination,
  }
}
