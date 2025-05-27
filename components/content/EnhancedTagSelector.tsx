import React, { useState, useMemo } from 'react'

import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface Tag {
  id: number
  name: string
  useCount?: number
}

interface EnhancedTagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onTagSelect: (tagId: number) => void
  className?: string
}

export default function EnhancedTagSelector({
  tags,
  selectedTagIds,
  onTagSelect,
  className = ''
}: EnhancedTagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAll, setShowAll] = useState(false)

  // 过滤和排序标签
  const filteredTags = useMemo(() => {
    let filtered = tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 按使用次数排序，已选择的标签优先显示
    filtered.sort((a, b) => {
      const aSelected = selectedTagIds.includes(a.id)
      const bSelected = selectedTagIds.includes(b.id)

      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1

      return (b.useCount || 0) - (a.useCount || 0)
    })

    return showAll ? filtered : filtered.slice(0, 20)
  }, [tags, searchTerm, selectedTagIds, showAll])

  // 获取标签的颜色深度
  const getTagColorIntensity = (useCount: number = 0) => {
    if (useCount > 100) return 'bg-blue-600 text-white'
    if (useCount > 50) return 'bg-blue-500 text-white'
    if (useCount > 20) return 'bg-blue-400 text-white'
    if (useCount > 10) return 'bg-blue-300 text-blue-900'
    if (useCount > 5) return 'bg-blue-200 text-blue-800'
    return 'bg-blue-100 text-blue-700'
  }

  // 格式化使用次数显示
  const formatUseCount = (count: number = 0) => {
    if (count > 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toString()
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-gray-700">标签</Label>

      {/* 搜索框 */}
      <div className="mt-2">
        <Input
          type="text"
          placeholder="搜索标签..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
          leftIcon={
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* 已选择的标签 */}
      {selectedTagIds.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-2">已选择 ({selectedTagIds.length})</div>
          <div className="flex flex-wrap gap-2">
            {tags
              .filter(tag => selectedTagIds.includes(tag.id))
              .map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onTagSelect(tag.id)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-300 shadow-sm hover:bg-primary-200 transition-all duration-200"
                >
                  {tag.name}
                  <span className="ml-1 text-primary-600">
                    {formatUseCount(tag.useCount)}
                  </span>
                  <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 可选择的标签 */}
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">
          可选择标签 ({filteredTags.filter(tag => !selectedTagIds.includes(tag.id)).length})
        </div>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
          {filteredTags.filter(tag => !selectedTagIds.includes(tag.id)).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filteredTags
                .filter(tag => !selectedTagIds.includes(tag.id))
                .map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onTagSelect(tag.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${getTagColorIntensity(tag.useCount)} border border-transparent hover:border-gray-300`}
                  >
                    {tag.name}
                    <span className="ml-1 opacity-75">
                      {formatUseCount(tag.useCount)}
                    </span>
                  </button>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {searchTerm ? '没有找到匹配的标签' : '暂无可用标签'}
            </p>
          )}
        </div>

        {/* 显示更多按钮 */}
        {!showAll && tags.filter(tag => !selectedTagIds.includes(tag.id)).length > 20 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            显示更多标签 ({tags.length - 20} 个)
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        除了选择已有标签，您还可以在标题中使用 #标签 格式添加新标签
      </p>
    </div>
  )
}
