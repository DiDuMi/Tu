import React from 'react'
import useSWR from 'swr'

import { fetcher } from '@/lib/fetcher'
import { useCategoryTree, type MediaCategory } from '@/hooks/useCategoryTree'

interface MediaTag {
  id: number
  uuid: string
  name: string
  color: string | null
}

interface MediaMetadataFormProps {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (description: string) => void
  categoryId: string
  setCategoryId: (categoryId: string) => void
  selectedTags: string[]
  onTagChange: (tagId: string) => void
}

export default function MediaMetadataForm({
  title,
  setTitle,
  description,
  setDescription,
  categoryId,
  setCategoryId,
  selectedTags,
  onTagChange
}: MediaMetadataFormProps) {
  // 获取分类和标签数据
  const { data: categories } = useSWR<MediaCategory[]>('/api/v1/media/categories', fetcher)
  const { data: tags } = useSWR<MediaTag[]>('/api/v1/media/tags', fetcher)

  const categoryTree = useCategoryTree(categories)

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">媒体信息</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="media-title" className="block text-sm font-medium text-gray-700 mb-1">
            标题
          </label>
          <input
            id="media-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="媒体标题（可选）"
          />
        </div>

        <div>
          <label htmlFor="media-description" className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            id="media-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="媒体描述（可选）"
          />
        </div>

        <div>
          <label htmlFor="media-category" className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <select
            id="media-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- 选择分类（可选） --</option>
            {categoryTree.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            标签
          </label>
          <div className="flex flex-wrap gap-2">
            {tags?.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagChange(tag.id.toString())}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${selectedTags.includes(tag.id.toString())
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
            ))}
            {!tags?.length && (
              <span className="text-sm text-gray-500">暂无可用标签</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export type { MediaMetadataFormProps }
