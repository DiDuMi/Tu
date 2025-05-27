import React, { useState, forwardRef } from 'react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

import { getTypeLabel, getTypeColor, getContentPreview, deleteTemplate, useTemplate } from '@/lib/templateUtils'

import TemplatePreviewModal, { type ContentTemplate } from './TemplatePreviewModal'

interface TemplateItemCardProps {
  template: ContentTemplate
  onEdit: (template: ContentTemplate) => void
  onDelete: () => void
  onSelect?: (template: ContentTemplate) => void
  compact?: boolean
  dragHandleProps?: any
  style?: React.CSSProperties
  className?: string
}

const TemplateItemCard = forwardRef<HTMLDivElement, TemplateItemCardProps>(({
  template,
  onEdit,
  onDelete,
  onSelect,
  compact = false,
  dragHandleProps,
  style,
  className = ''
}, ref) => {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null)

  // 处理删除模板
  const handleDelete = async () => {
    if (!confirm(`确定要删除模板"${template.title}"吗？`)) {
      return
    }

    setDeletingId(template.id)
    try {
      await deleteTemplate(template.id)
      onDelete()
    } catch (error) {
      alert(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  // 处理使用模板
  const handleUseTemplate = async () => {
    await useTemplate(template.id)
    if (onSelect) {
      onSelect(template)
    }
  }

  return (
    <>
      <Card
        ref={ref}
        style={style}
        className={`border border-gray-200 hover:border-purple-300 transition-colors ${className}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            {/* 拖拽手柄 */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="flex-shrink-0 mr-3 mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4z" />
                  <path d="M9 6a1 1 0 000 2h2a1 1 0 100-2H9zM9 8a1 1 0 000 2h2a1 1 0 100-2H9zM9 10a1 1 0 000 2h2a1 1 0 100-2H9z" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {template.title}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(template.type)}`}>
                  {getTypeLabel(template.type)}
                </span>
                {template.isPublic && (
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                    公开
                  </span>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {template.description}
                </p>
              )}

              <p className="text-sm text-gray-500 mb-2">
                {getContentPreview(template.content, compact ? 60 : 100)}
              </p>

              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {template.tags.slice(0, compact ? 2 : 5).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                    >
                      #{tag.name}
                    </span>
                  ))}
                  {template.tags.length > (compact ? 2 : 5) && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{template.tags.length - (compact ? 2 : 5)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <span>排序: {template.sortOrder}</span>
                <span>使用 {template.useCount} 次</span>
                <span>作者: {template.user.name}</span>
                <span>{new Date(template.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {onSelect && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUseTemplate}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  使用
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewTemplate(template)}
              >
                预览
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(template)}
              >
                编辑
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={deletingId === template.id}
                className="text-red-600 hover:bg-red-50"
              >
                {deletingId === template.id ? '删除中...' : '删除'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览模态框 */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </>
  )
})

TemplateItemCard.displayName = 'TemplateItemCard'

export default TemplateItemCard
export type { TemplateItemCardProps }
