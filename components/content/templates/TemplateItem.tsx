import React, { useState } from 'react'

import { Badge } from '@/components/ui/Badge'

interface Template {
  id: number
  title: string
  content: string
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  description?: string
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  createdAt: string
  updatedAt: string
}

interface TemplateItemProps {
  template: Template
  onInsert: (template: Template, position: 'top' | 'cursor' | 'bottom') => void
  isRecommended: boolean
}

export default function TemplateItem({ template, onInsert, isRecommended }: TemplateItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isRecommended
          ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h6 className="text-sm font-medium text-gray-900 truncate">
            {template.title || '无标题模板'}
          </h6>
          {template.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={() => onInsert(template, 'top')}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="插入到顶部"
            >
              顶部
            </button>
            <button
              onClick={() => onInsert(template, 'cursor')}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              title="插入到光标位置"
            >
              光标
            </button>
            <button
              onClick={() => onInsert(template, 'bottom')}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              title="插入到底部"
            >
              底部
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export type { Template, TemplateItemProps }
