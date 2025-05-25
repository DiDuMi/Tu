import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { fetcher } from '@/lib/api'
import TemplateEditor from './TemplateEditor'
import TemplateList from './TemplateList'
import SortableTemplateList from './SortableTemplateList'

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

interface ContentTemplateManagerProps {
  className?: string
  onTemplateSelect?: (template: ContentTemplate) => void
  showCreateButton?: boolean
  compact?: boolean
  enableSorting?: boolean
}

export default function ContentTemplateManager({
  className = '',
  onTemplateSelect,
  showCreateButton = true,
  compact = false,
  enableSorting = false
}: ContentTemplateManagerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [isPublicFilter, setIsPublicFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  // 构建查询参数
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: compact ? '10' : '20',
    ...(searchTerm && { search: searchTerm }),
    ...(typeFilter && { type: typeFilter }),
    ...(isPublicFilter && { isPublic: isPublicFilter }),
    sortBy: 'sortOrder',
    sortOrder: 'asc'
  })

  const { data, error, mutate } = useSWR(
    `/api/v1/content-templates?${queryParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  const templates = data?.success ? data.data.items : []
  const pagination = data?.success ? data.data.pagination : null
  const isLoading = !data && !error

  // 处理创建新模板
  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setIsEditorOpen(true)
  }

  // 处理编辑模板
  const handleEditTemplate = (template: ContentTemplate) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }

  // 处理模板保存成功
  const handleTemplateSaved = () => {
    setIsEditorOpen(false)
    setEditingTemplate(null)
    mutate()
  }

  // 处理模板删除
  const handleTemplateDeleted = () => {
    mutate()
  }

  // 处理模板选择
  const handleTemplateSelect = (template: ContentTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
  }

  // 处理模板重排序
  const handleTemplateReorder = async (reorderedTemplates: ContentTemplate[]) => {
    try {
      const templateIds = reorderedTemplates.map(template => template.id)

      const response = await fetch('/api/v1/content-templates/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateIds })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Reorder failed:', errorData.error?.message)
        // 重新获取数据以恢复原始顺序
        mutate()
      }
    } catch (error) {
      console.error('Reorder error:', error)
      // 重新获取数据以恢复原始顺序
      mutate()
    }
  }

  // 重置筛选
  const handleResetFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setIsPublicFilter('')
    setCurrentPage(1)
  }

  // 处理搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, typeFilter, isPublicFilter])

  return (
    <div className={className}>
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {compact ? '模板' : '预设模板'}
              </h3>
            </div>
            {showCreateButton && (
              <Button
                size="sm"
                onClick={handleCreateTemplate}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                新建模板
              </Button>
            )}
          </div>

          {/* 筛选器 */}
          {!compact && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Input
                placeholder="搜索模板..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                }
              />

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">所有类型</option>
                <option value="HEADER">页头模板</option>
                <option value="FOOTER">页尾模板</option>
                <option value="GENERAL">通用模板</option>
              </Select>

              <Select
                value={isPublicFilter}
                onChange={(e) => setIsPublicFilter(e.target.value)}
              >
                <option value="">所有模板</option>
                <option value="false">我的模板</option>
                <option value="true">公开模板</option>
              </Select>

              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="text-sm"
              >
                重置筛选
              </Button>
            </div>
          )}

          {/* 模板列表 */}
          {enableSorting ? (
            <SortableTemplateList
              templates={templates}
              isLoading={isLoading}
              error={error}
              onEdit={handleEditTemplate}
              onDelete={handleTemplateDeleted}
              onSelect={handleTemplateSelect}
              onReorder={handleTemplateReorder}
              compact={compact}
              enableSorting={enableSorting}
            />
          ) : (
            <TemplateList
              templates={templates}
              isLoading={isLoading}
              error={error}
              onEdit={handleEditTemplate}
              onDelete={handleTemplateDeleted}
              onSelect={handleTemplateSelect}
              compact={compact}
            />
          )}

          {/* 分页 */}
          {!compact && pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  上一页
                </Button>

                <span className="text-sm text-gray-500">
                  第 {currentPage} 页，共 {pagination.pages} 页
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模板编辑器 */}
      {isEditorOpen && (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleTemplateSaved}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  )
}
