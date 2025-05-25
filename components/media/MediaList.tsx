import React, { useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'

import useMediaStore from '@/stores/mediaStore'
import { ViewMode } from '@/stores/mediaStore'

import MediaGridView from './MediaGridView'
import MediaListView from './MediaListView'

interface MediaListProps {
  className?: string
}

const MediaList: React.FC<MediaListProps> = ({ className = '' }) => {
  const {
    mediaItems,
    pagination,
    filter,
    viewMode,
    selectedItems,
    setFilter,
    setMediaItems,
    setIsLoading,
    setError,
    selectItem,
    unselectItem,
    selectAll,
    unselectAll
  } = useMediaStore()

  // 构建API URL
  const getApiUrl = () => {
    const params = new URLSearchParams()
    params.append('page', filter.page?.toString() || '1')
    params.append('limit', filter.limit?.toString() || '20')

    if (filter.type && filter.type !== 'ALL') {
      params.append('type', filter.type)
    }

    if (filter.search) {
      params.append('search', filter.search)
    }

    if (filter.sortBy) {
      params.append('sortBy', filter.sortBy)
    }

    if (filter.sortOrder) {
      params.append('sortOrder', filter.sortOrder)
    }

    if (filter.startDate) {
      params.append('startDate', filter.startDate)
    }

    if (filter.endDate) {
      params.append('endDate', filter.endDate)
    }

    return `/api/v1/media?${params.toString()}`
  }

  // 获取媒体列表数据
  const { data, error, isLoading, mutate } = useSWR(
    getApiUrl(),
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || '获取媒体列表失败')
      }
      return res.json()
    }
  )

  // 更新状态
  useEffect(() => {
    setIsLoading(isLoading)

    if (error) {
      setError(error.message)
    }

    if (data && data.success) {
      setMediaItems(data.data)
    }
  }, [data, error, isLoading, setError, setIsLoading, setMediaItems])

  // 处理页码变更
  const handlePageChange = (page: number) => {
    setFilter({ page })
  }

  // 处理选择/取消选择媒体项
  const handleSelectItem = (uuid: string, isSelected: boolean) => {
    if (isSelected) {
      unselectItem(uuid)
    } else {
      selectItem(uuid)
    }
  }

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (!mediaItems || !mediaItems.length) {
      return;
    }

    if (selectedItems.length === mediaItems.length) {
      unselectAll()
    } else {
      selectAll()
    }
  }

  // 渲染视图（网格或列表）
  const renderView = () => {
    if (!mediaItems) {
      return null;
    }

    if (viewMode === 'grid') {
      return (
        <MediaGridView
          mediaItems={mediaItems}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
        />
      )
    } else {
      return (
        <MediaListView
          mediaItems={mediaItems}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
        />
      )
    }
  }

  // 渲染分页控件
  const renderPagination = () => {
    const { total, page, limit, totalPages } = pagination

    if (total === 0) return null

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          显示 <span className="font-medium">{(page - 1) * limit + 1}</span> 到{' '}
          <span className="font-medium">{Math.min(page * limit, total)}</span> 条，共{' '}
          <span className="font-medium">{total}</span> 条
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            上一页
          </button>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            下一页
          </button>
        </div>
      </div>
    )
  }

  // 渲染空状态
  const renderEmptyState = () => {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">没有媒体</h3>
        <p className="mt-1 text-sm text-gray-500">开始上传媒体文件或调整筛选条件。</p>
        <div className="mt-6">
          <Link href="/admin/media/upload" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            上传媒体
          </Link>
        </div>
      </div>
    )
  }

  // 渲染错误状态
  const renderError = () => {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">加载媒体失败</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error || '获取媒体列表时发生错误，请稍后重试。'}
        </p>
        <div className="mt-6">
          <button
            onClick={() => mutate()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        renderError()
      ) : !mediaItems || mediaItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderView()}
          {renderPagination()}
        </>
      )}
    </div>
  )
}



export default MediaList
