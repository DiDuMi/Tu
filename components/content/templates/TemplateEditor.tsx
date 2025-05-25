import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import TinyMCEEditor from '@/components/content/TinyMCEEditor'
import EnhancedTagSelector from '@/components/content/EnhancedTagSelector'
import { fetcher } from '@/lib/api'

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

interface TemplateEditorProps {
  template?: ContentTemplate | null
  onSave: (template?: ContentTemplate) => void
  onCancel: () => void
}

export default function TemplateEditor({
  template,
  onSave,
  onCancel
}: TemplateEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<'HEADER' | 'FOOTER' | 'GENERAL'>('GENERAL')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [sortOrder, setSortOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})

  // 获取标签列表
  const { data: tagsData } = useSWR('/api/v1/tags', fetcher)
  const tags = tagsData?.data?.items || []

  // 初始化表单数据
  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setContent(template.content)
      setType(template.type)
      setDescription(template.description || '')
      setIsPublic(template.isPublic)
      setIsActive(template.isActive)
      setSelectedTagIds(template.tags.map(tag => tag.id))
      setSortOrder(template.sortOrder)
    } else {
      // 重置表单
      setTitle('')
      setContent('')
      setType('GENERAL')
      setDescription('')
      setIsPublic(false)
      setIsActive(true)
      setSelectedTagIds([])
      setSortOrder(0)
    }
    setError(null)
    setValidationErrors({})
  }, [template])

  // 实时验证
  useEffect(() => {
    const errors: {[key: string]: string} = {}

    if (title.length > 200) {
      errors.title = '标题不能超过200个字符'
    }

    if (content.length > 0 && !content.trim()) {
      errors.content = '内容不能为空'
    }

    setValidationErrors(errors)
  }, [title, content])

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('表单提交被触发', { content, contentLength: content.length, contentTrimmed: content.trim() })

    // 清除之前的错误
    setError(null)

    // 验证必填字段
    if (!content.trim()) {
      console.log('内容验证失败：内容为空')
      setError('内容不能为空')
      return
    }

    console.log('开始提交模板...')
    setIsSubmitting(true)

    try {
      const requestData = {
        title: title.trim() || undefined,
        content,
        type,
        description: description.trim() || undefined,
        isPublic,
        isActive,
        tagIds: selectedTagIds,
        sortOrder
      }

      const url = template
        ? `/api/v1/content-templates/${template.id}`
        : '/api/v1/content-templates'

      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const responseData = await response.json()
        onSave(responseData.data)
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || '保存失败')
      }
    } catch (error) {
      console.error('Save template error:', error)
      setError('保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理按钮点击（用于调试）
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('按钮被点击', {
      disabled: isSubmitting || !content.trim() || Object.keys(validationErrors).length > 0,
      isSubmitting,
      contentEmpty: !content.trim(),
      validationErrors: Object.keys(validationErrors).length,
      content: content.substring(0, 50) + '...'
    })

    // 如果按钮应该是可用的但表单提交没有触发，直接调用提交函数
    const shouldBeEnabled = !isSubmitting && content.trim() && Object.keys(validationErrors).length === 0
    if (shouldBeEnabled) {
      console.log('按钮应该可用，尝试直接提交...')
      // 创建一个模拟的表单事件
      const mockEvent = {
        preventDefault: () => {}
      } as React.FormEvent
      handleSubmit(mockEvent)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">
            {template ? '编辑模板' : '创建模板'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入模板标题（可选）"
                  className={validationErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">模板类型</Label>
                <Select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'HEADER' | 'FOOTER' | 'GENERAL')}
                >
                  <option value="GENERAL">通用模板</option>
                  <option value="HEADER">页头模板</option>
                  <option value="FOOTER">页尾模板</option>
                </Select>
              </div>
            </div>

            {/* 描述 */}
            <div>
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入模板描述（可选）"
                rows={2}
              />
            </div>

            {/* 内容编辑器 */}
            <div>
              <Label>
                内容 <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2">
                <TinyMCEEditor
                  value={content}
                  onChange={setContent}
                  height={300}
                  placeholder="输入模板内容..."
                />
              </div>
              {validationErrors.content && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
              )}
            </div>

            {/* 标签选择 */}
            <EnhancedTagSelector
              tags={tags}
              selectedTagIds={selectedTagIds}
              onTagSelect={handleTagSelect}
            />

            {/* 设置选项 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sortOrder">排序顺序</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Label htmlFor="isPublic">公开模板</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Label htmlFor="isActive">启用模板</Label>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim() || Object.keys(validationErrors).length > 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleButtonClick}
              title={
                isSubmitting ? '正在提交...' :
                !content.trim() ? '请输入内容' :
                Object.keys(validationErrors).length > 0 ? `验证错误: ${Object.values(validationErrors).join(', ')}` :
                '点击创建模板'
              }
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  保存中...
                </>
              ) : (
                template ? '更新模板' : '创建模板'
              )}
            </Button>

            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs text-gray-500">
                <div>内容长度: {content.length}</div>
                <div>内容为空: {!content.trim() ? '是' : '否'}</div>
                <div>验证错误: {Object.keys(validationErrors).length}</div>
                <div>提交中: {isSubmitting ? '是' : '否'}</div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
