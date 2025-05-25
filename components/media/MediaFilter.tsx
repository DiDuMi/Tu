import React, { useState, useEffect } from 'react'
import useMediaStore from '@/stores/mediaStore'
import { MediaType, MediaSortBy, SortOrder, ViewMode } from '@/stores/mediaStore'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Settings } from 'lucide-react'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  slug: string
  parentId: number | null
  children?: MediaCategory[]
}

interface MediaTag {
  id: number
  uuid: string
  name: string
  color: string | null
}

interface MediaFilterProps {
  className?: string
}

const MediaFilter: React.FC<MediaFilterProps> = ({ className = '' }) => {
  const {
    filter,
    viewMode,
    setFilter,
    setViewMode,
    selectedItems,
    deleteMedia,
    unselectAll
  } = useMediaStore()

  const [searchValue, setSearchValue] = useState(filter.search || '')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(filter.categoryId?.toString() || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    Array.isArray(filter.tagIds)
      ? filter.tagIds.map(id => id.toString())
      : []
  )

  // 获取分类和标签数据
  const { data: categories } = useSWR<MediaCategory[]>('/api/v1/media/categories', fetcher)
  const { data: tags } = useSWR<MediaTag[]>('/api/v1/media/tags', fetcher)

  // 同步搜索值和筛选条件
  useEffect(() => {
    setSearchValue(filter.search || '')
    setSelectedCategoryId(filter.categoryId?.toString() || '')
    setSelectedTagIds(
      Array.isArray(filter.tagIds)
        ? filter.tagIds.map(id => id.toString())
        : []
    )
  }, [filter.search, filter.categoryId, filter.tagIds])

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilter({ search: searchValue, page: 1 })
  }

  // 处理类型变更
  const handleTypeChange = (type: MediaType) => {
    setFilter({ type, page: 1 })
  }

  // 处理排序变更
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const [sortBy, sortOrder] = value.split('-') as [MediaSortBy, SortOrder]
    setFilter({ sortBy, sortOrder, page: 1 })
  }

  // 处理视图模式变更
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  // 处理分类变更
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value || undefined
    setSelectedCategoryId(categoryId || '')
    setFilter({ categoryId: categoryId ? parseInt(categoryId) : undefined, page: 1 })
  }

  // 处理标签变更
  const handleTagChange = (tagId: string) => {
    let newSelectedTags: string[]

    if (selectedTagIds.includes(tagId)) {
      // 如果已选中，则移除
      newSelectedTags = selectedTagIds.filter(id => id !== tagId)
    } else {
      // 如果未选中，则添加
      newSelectedTags = [...selectedTagIds, tagId]
    }

    setSelectedTagIds(newSelectedTags)
    setFilter({
      tagIds: newSelectedTags.length > 0 ? newSelectedTags.map(id => parseInt(id)) : undefined,
      page: 1
    })
  }

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setSearchValue('')
    setSelectedCategoryId('')
    setSelectedTagIds([])
    setFilter({
      search: undefined,
      categoryId: undefined,
      tagIds: undefined,
      page: 1
    })
  }

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (selectedItems.length === 0) return

    setIsDeleting(true)
    try {
      await deleteMedia(selectedItems)
      setIsDeleteModalOpen(false)
      unselectAll()
    } catch (error) {
      console.error('删除媒体失败:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        {/* 搜索框 */}
        <div className="w-full md:w-1/3">
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              placeholder="搜索媒体..."
              className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {/* 筛选和排序控件 */}
        <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0">
          {/* 类型筛选 */}
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handleTypeChange('ALL')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                filter.type === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('IMAGE')}
              className={`px-3 py-2 text-sm font-medium ${
                filter.type === 'IMAGE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              图片
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('VIDEO')}
              className={`px-3 py-2 text-sm font-medium ${
                filter.type === 'VIDEO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              视频
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('AUDIO')}
              className={`px-3 py-2 text-sm font-medium ${
                filter.type === 'AUDIO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              音频
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('CLOUD_VIDEO')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                filter.type === 'CLOUD_VIDEO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              云媒体
            </button>
          </div>

          {/* 高级筛选按钮 */}
          <button
            type="button"
            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
            className={`inline-flex items-center px-3 py-2 border ${
              isAdvancedFilterOpen || selectedCategoryId || selectedTagIds.length > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700'
            } rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Settings className="h-4 w-4 mr-1" />
            高级筛选
            {(selectedCategoryId || selectedTagIds.length > 0) && (
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {(selectedCategoryId ? 1 : 0) + (selectedTagIds.length > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          {/* 排序选择 */}
          <select
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onChange={handleSortChange}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="createdAt-desc">最新上传</option>
            <option value="createdAt-asc">最早上传</option>
            <option value="title-asc">名称 A-Z</option>
            <option value="title-desc">名称 Z-A</option>
            <option value="fileSize-desc">文件大小 ↓</option>
            <option value="fileSize-asc">文件大小 ↑</option>
          </select>

          {/* 视图模式切换 */}
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              } rounded-l-md`}
              title="网格视图"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              } rounded-r-md`}
              title="列表视图"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 高级筛选面板 */}
      {isAdvancedFilterOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">高级筛选</h3>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              清除所有筛选
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 分类筛选 */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                id="category-filter"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">
                {tags?.length ? (
                  tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagChange(tag.id.toString())}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTagIds.includes(tag.id.toString())
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      } border`}
                    >
                      {tag.color && (
                        <span
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                      {tag.name}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">暂无可用标签</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量操作工具栏 */}
      {selectedItems.length > 0 && (
        <div className="mt-4 flex items-center justify-between bg-gray-50 p-2 rounded-md">
          <div className="text-sm text-gray-700">
            已选择 <span className="font-medium">{selectedItems.length}</span> 项
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
            <button
              type="button"
              onClick={unselectAll}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={isDeleteModalOpen}
        title="确认删除"
        message={`您确定要删除选中的 ${selectedItems.length} 项媒体吗？此操作无法撤销。`}
        confirmButtonText="删除"
        cancelButtonText="取消"
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}

export default MediaFilter
