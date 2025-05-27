import { useState, useEffect } from 'react'
import useSWR from 'swr'

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

interface UseTemplateFormProps {
  template?: ContentTemplate | null
  onSave: (template: ContentTemplate) => void
}

export function useTemplateForm({ template, onSave }: UseTemplateFormProps) {
  // 表单状态
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

  return {
    // 表单状态
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    isActive,
    setIsActive,
    selectedTagIds,
    sortOrder,
    setSortOrder,
    isSubmitting,
    error,
    validationErrors,
    tags,
    
    // 处理函数
    handleTagSelect,
    handleSubmit,
    handleButtonClick
  }
}

export type { ContentTemplate }
