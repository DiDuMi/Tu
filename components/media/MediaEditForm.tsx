import React, { useState, useEffect } from 'react'
import { MediaResponse, MediaCategoryResponse, MediaTagResponse } from '@/types/api'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

interface MediaEditFormProps {
  media: MediaResponse
  onSubmit: (data: {
    title: string;
    description: string;
    categoryId?: number | null;
    tagIds?: number[];
  }) => Promise<void>
  onCancel: () => void
  className?: string
}

const MediaEditForm: React.FC<MediaEditFormProps> = ({
  media,
  onSubmit,
  onCancel,
  className = '',
}) => {
  // 获取分类和标签数据
  const { data: categories } = useSWR<MediaCategoryResponse[]>('/api/v1/media/categories', fetcher)
  const { data: tags } = useSWR<MediaTagResponse[]>('/api/v1/media/tags', fetcher)

  const [title, setTitle] = useState(media.title || '')
  const [description, setDescription] = useState(media.description || '')
  const [categoryId, setCategoryId] = useState<number | null | undefined>(
    media.category ? media.category.id : null
  )
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    media.tags ? media.tags.map(tag => tag.id) : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 处理标签选择
  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title,
        description,
        categoryId,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新媒体信息失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          标题
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          描述
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          分类
        </label>
        <select
          id="category"
          value={categoryId?.toString() || ''}
          onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">-- 无分类 --</option>
          {categories?.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          标签
        </label>
        <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
          {tags?.length ? (
            tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTagIds.includes(tag.id)
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
              {categories === undefined ? '加载标签中...' : '暂无可用标签'}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

export default MediaEditForm
