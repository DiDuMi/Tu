import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { fetcher } from '@/lib/api'

interface ContentTemplate {
  id: number
  uuid: string
  title: string
  content: string
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  description?: string
  isPublic: boolean
  useCount: number
  matchScore: number
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

interface TemplateRecommendationsProps {
  title: string
  onInsertTemplate: (content: string, position: 'top' | 'cursor' | 'bottom') => void
  enabled?: boolean
  className?: string
}

export default function TemplateRecommendations({
  title,
  onInsertTemplate,
  enabled = true,
  className = ''
}: TemplateRecommendationsProps) {
  const [extractedTags, setExtractedTags] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)
  const [insertPosition, setInsertPosition] = useState<'top' | 'cursor' | 'bottom'>('cursor')

  // 从标题中提取标签
  useEffect(() => {
    if (!title || !enabled) {
      setExtractedTags([])
      return
    }

    const tagRegex = /#([^\s#]+)/g
    const matches = title.match(tagRegex)
    if (matches) {
      const tags = matches.map(match => match.substring(1)) // 移除 # 符号
      setExtractedTags(tags)
    } else {
      setExtractedTags([])
    }
  }, [title, enabled])

  // 构建推荐查询参数
  const queryParams = new URLSearchParams({
    limit: '5',
    ...(extractedTags.length > 0 && { tags: extractedTags.join(',') })
  })

  // 获取推荐模板
  const { data, error } = useSWR(
    enabled && extractedTags.length > 0
      ? `/api/v1/content-templates/recommend?${queryParams}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  const recommendations = data?.success ? data.data.items : []
  const isLoading = !data && !error && extractedTags.length > 0

  // 处理模板插入
  const handleInsertTemplate = async (template: ContentTemplate) => {
    try {
      // 记录使用次数
      await fetch(`/api/v1/content-templates/${template.id}/use`, {
        method: 'POST'
      })

      onInsertTemplate(template.content, insertPosition)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Insert template error:', error)
      // 即使记录失败也继续插入模板
      onInsertTemplate(template.content, insertPosition)
      setSelectedTemplate(null)
    }
  }

  // 获取内容预览
  const getContentPreview = (content: string, maxLength = 80) => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + '...'
      : textContent
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

  if (!enabled || extractedTags.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <div className="w-1 h-5 bg-orange-500 rounded-full mr-2"></div>
            <h4 className="text-sm font-medium text-gray-900">推荐模板</h4>
            <div className="ml-2 text-xs text-gray-500">
              基于标签: {extractedTags.map(tag => `#${tag}`).join(', ')}
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded h-16"></div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-red-500">加载推荐失败</p>
            </div>
          )}

          {!isLoading && !error && recommendations.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">暂无相关推荐</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {template.title}
                        </h5>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${getTypeColor(template.type)}`}>
                          {getTypeLabel(template.type)}
                        </span>
                        {template.matchScore > 0 && (
                          <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                            {Math.round(template.matchScore * 100)}% 匹配
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-1">
                        {getContentPreview(template.content)}
                      </p>

                      <div className="flex items-center text-xs text-gray-400 space-x-2">
                        <span>使用 {template.useCount} 次</span>
                        <span>•</span>
                        <span>{template.user.name}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTemplate(template)
                      }}
                      className="ml-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      使用
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模板插入确认对话框 */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">插入模板</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-2">{selectedTemplate.title}</h4>
              {selectedTemplate.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  插入位置
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'top', label: '内容顶部' },
                    { value: 'cursor', label: '当前光标位置' },
                    { value: 'bottom', label: '内容底部' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="position"
                        value={option.value}
                        checked={insertPosition === option.value}
                        onChange={(e) => setInsertPosition(e.target.value as any)}
                        className="mr-2"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedTemplate(null)}
              >
                取消
              </Button>
              <Button
                onClick={() => handleInsertTemplate(selectedTemplate)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                插入模板
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
