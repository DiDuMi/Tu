import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface ContentTemplate {
  id: number
  uuid: string
  title: string
  content: string
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  description?: string
  isPublic: boolean
  isActive: boolean
  useCount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    avatar?: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface TemplateListProps {
  templates: ContentTemplate[]
  isLoading: boolean
  error: any
  onEdit: (template: ContentTemplate) => void
  onDelete: () => void
  onSelect?: (template: ContentTemplate) => void
  compact?: boolean
}

export default function TemplateList({
  templates,
  isLoading,
  error,
  onEdit,
  onDelete,
  onSelect,
  compact = false
}: TemplateListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<ContentTemplate | null>(null)

  // 处理删除模板
  const handleDelete = async (template: ContentTemplate) => {
    if (!confirm(`确定要删除模板"${template.title}"吗？`)) {
      return
    }

    setDeletingId(template.id)
    try {
      const response = await fetch(`/api/v1/content-templates/${template.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onDelete()
      } else {
        const errorData = await response.json()
        alert(errorData.error?.message || '删除失败')
      }
    } catch (error) {
      console.error('Delete template error:', error)
      alert('删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  // 处理使用模板
  const handleUseTemplate = async (template: ContentTemplate) => {
    try {
      // 记录使用次数
      await fetch(`/api/v1/content-templates/${template.id}/use`, {
        method: 'POST'
      })

      if (onSelect) {
        onSelect(template)
      }
    } catch (error) {
      console.error('Use template error:', error)
      // 即使记录失败也继续使用模板
      if (onSelect) {
        onSelect(template)
      }
    }
  }

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HEADER': return '页头'
      case 'FOOTER': return '页尾'
      case 'GENERAL': return '通用'
      default: return type
    }
  }

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HEADER': return 'bg-blue-100 text-blue-800'
      case 'FOOTER': return 'bg-green-100 text-green-800'
      case 'GENERAL': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 截取内容预览
  const getContentPreview = (content: string, maxLength = 100) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + '...'
      : textContent
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 3 : 5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-500">加载模板失败</p>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-500">暂无模板</p>
      </div>
    )
  }

  return (
    <>
      <div className={`space-y-3 ${compact ? 'max-h-60 overflow-y-auto' : ''}`}>
        {templates.map((template) => (
          <Card key={template.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
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
                      onClick={() => handleUseTemplate(template)}
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
                    onClick={() => handleDelete(template)}
                    disabled={deletingId === template.id}
                    className="text-red-600 hover:bg-red-50"
                  >
                    {deletingId === template.id ? '删除中...' : '删除'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 预览模态框 */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">模板预览</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <h4 className="font-medium text-gray-900 mb-2">{previewTemplate.title}</h4>
              {previewTemplate.description && (
                <p className="text-sm text-gray-600 mb-4">{previewTemplate.description}</p>
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
