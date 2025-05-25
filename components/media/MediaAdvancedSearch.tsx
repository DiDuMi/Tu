import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { MagnifyingGlassIcon as SearchIcon, XMarkIcon as XIcon, FunnelIcon as FilterIcon } from '@heroicons/react/24/outline'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import useMediaStore from '@/stores/mediaStore'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface MediaAdvancedSearchProps {
  onClose?: () => void
  className?: string
}

const MediaAdvancedSearch: React.FC<MediaAdvancedSearchProps> = ({
  onClose,
  className = '',
}) => {
  const router = useRouter()
  const { filter, setFilter } = useMediaStore()

  // 搜索条件
  const [searchTerm, setSearchTerm] = useState(filter.search || '')
  const [selectedType, setSelectedType] = useState<string>(filter.type || 'ALL')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(filter.categoryId?.toString() || '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    Array.isArray(filter.tagIds)
      ? filter.tagIds.map(id => id.toString())
      : []
  )
  const [selectedUserId, setSelectedUserId] = useState<string>(filter.userId?.toString() || '')
  const [selectedStatus, setSelectedStatus] = useState<string>(filter.status || '')
  const [startDate, setStartDate] = useState<Date | null>(filter.startDate ? new Date(filter.startDate) : null)
  const [endDate, setEndDate] = useState<Date | null>(filter.endDate ? new Date(filter.endDate) : null)
  const [sortBy, setSortBy] = useState<string>(filter.sortBy || 'createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filter.sortOrder || 'desc')

  // 获取分类和标签数据
  const { data: categories } = useSWR<any[]>('/api/v1/media/categories', fetcher)
  const { data: tags } = useSWR<any[]>('/api/v1/media/tags', fetcher)
  const { data: users } = useSWR<any[]>('/api/v1/users?limit=100', fetcher)

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 构建筛选条件
    const newFilter: any = {
      page: 1,
      search: searchTerm || undefined,
      type: selectedType !== 'ALL' ? selectedType : undefined,
      categoryId: selectedCategoryId || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds.map(id => parseInt(id)) : undefined,
      userId: selectedUserId || undefined,
      status: selectedStatus || undefined,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      sortBy,
      sortOrder,
    }

    // 更新筛选条件
    setFilter(newFilter)

    // 关闭搜索面板
    if (onClose) {
      onClose()
    }
  }

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedType('ALL')
    setSelectedCategoryId('')
    setSelectedTagIds([])
    setSelectedUserId('')
    setSelectedStatus('')
    setStartDate(null)
    setEndDate(null)
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  // 处理标签选择
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // 构建分类树
  const buildCategoryTree = (categories: any[] = []): { value: string, label: string, children?: any[] }[] => {
    const categoryMap: Record<number, any> = {}
    const rootCategories: any[] = []

    // 首先创建一个以ID为键的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] }
    })

    // 然后构建树结构
    categories.forEach(category => {
      if (category.parentId === null) {
        rootCategories.push(categoryMap[category.id])
      } else if (categoryMap[category.parentId]) {
        categoryMap[category.parentId].children.push(categoryMap[category.id])
      }
    })

    // 转换为下拉菜单选项格式
    const convertToOptions = (cats: any[], level = 0): any[] => {
      return cats.map(cat => {
        const option = {
          value: cat.id.toString(),
          label: '　'.repeat(level) + cat.name,
        }

        if (cat.children && cat.children.length > 0) {
          return {
            ...option,
            children: convertToOptions(cat.children, level + 1)
          }
        }

        return option
      })
    }

    return convertToOptions(rootCategories)
  }

  // 渲染分类选项
  const renderCategoryOptions = (options: any[]) => {
    return options.map(option => {
      if (option.children) {
        return (
          <React.Fragment key={option.value}>
            <option value={option.value}>{option.label}</option>
            {renderCategoryOptions(option.children)}
          </React.Fragment>
        )
      }
      return <option key={option.value} value={option.value}>{option.label}</option>
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <FilterIcon className="h-5 w-5 mr-2" />
          高级搜索
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <XIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 搜索词 */}
          <div className="md:col-span-2">
            <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">
              关键词搜索
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search-term"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="搜索标题、描述或文件类型..."
              />
            </div>
          </div>

          {/* 媒体类型 */}
          <div>
            <label htmlFor="media-type" className="block text-sm font-medium text-gray-700 mb-1">
              媒体类型
            </label>
            <select
              id="media-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">所有类型</option>
              <option value="IMAGE">图片</option>
              <option value="VIDEO">视频</option>
              <option value="AUDIO">音频</option>
              <option value="CLOUD_VIDEO">云媒体</option>
            </select>
          </div>

          {/* 分类 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有分类</option>
              {categories && renderCategoryOptions(buildCategoryTree(categories))}
            </select>
          </div>

          {/* 状态 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有状态</option>
              <option value="ACTIVE">正常</option>
              <option value="PROCESSING">处理中</option>
              <option value="ERROR">错误</option>
            </select>
          </div>

          {/* 上传者 */}
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
              上传者
            </label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">所有用户</option>
              {(users as any)?.data?.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* 日期范围 */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <DatePicker
                id="start-date"
                selected={startDate}
                onChange={setStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholderText="选择开始日期"
                isClearable
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <DatePicker
                id="end-date"
                selected={endDate}
                onChange={setEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="yyyy-MM-dd"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholderText="选择结束日期"
                isClearable
              />
            </div>
          </div>

          {/* 排序 */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                排序字段
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">上传时间</option>
                <option value="title">标题</option>
                <option value="fileSize">文件大小</option>
                <option value="type">媒体类型</option>
                <option value="updatedAt">更新时间</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
                排序方向
              </label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>

          {/* 标签 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
              {tags?.length ? (
                tags.map((tag: any) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id.toString())}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
                <div className="flex items-center justify-center w-full h-full text-gray-500">
                  {tags === undefined ? '加载标签中...' : '暂无可用标签'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            清除筛选条件
          </button>
          <div className="flex space-x-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              应用筛选
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default MediaAdvancedSearch
