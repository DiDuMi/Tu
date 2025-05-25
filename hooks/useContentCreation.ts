import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useFetch } from '@/hooks/useFetch'
import { useMutation } from '@/hooks/useFetch'
import { extractExcerpt } from '@/lib/content'
import { Category, Tag } from '@/stores/contentStore'

/**
 * 内容创建自定义Hook
 * 用于管理内容创建相关的状态和操作
 */
export function useContentCreation() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // 表单状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState('DRAFT')
  const [featured, setFeatured] = useState(false)
  const [scheduledPublishAt, setScheduledPublishAt] = useState<string | null>(null)
  const [scheduledArchiveAt, setScheduledArchiveAt] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取分类列表
  const { data: categoriesData } = useFetch<{ success: boolean, data: { items: Category[] } }>(
    mounted ? '/api/v1/categories?limit=100' : null
  )

  // 获取标签列表
  const { data: tagsData } = useFetch<{ success: boolean, data: { items: Tag[] } }>(
    mounted ? '/api/v1/tags?limit=100' : null
  )

  // 创建内容的API调用
  const { post: createPage, loading: createLoading } = useMutation('/api/v1/pages')

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理标题变化
  const handleTitleChange = (value: string) => {
    setTitle(value)
  }

  // 处理内容变化
  const handleContentChange = (value: string) => {
    setContent(value)
  }

  // 处理摘要变化
  const handleExcerptChange = (value: string) => {
    setExcerpt(value || null)
  }

  // 处理分类变化
  const handleCategoryChange = (value: number | null) => {
    setCategoryId(value)
  }

  // 处理状态变化
  const handleStatusChange = (value: string) => {
    setStatus(value)
  }

  // 处理精选变化
  const handleFeaturedChange = (value: boolean) => {
    setFeatured(value)
  }

  // 处理计划发布时间变化
  const handleScheduledPublishAtChange = (value: string | null) => {
    setScheduledPublishAt(value)
  }

  // 处理计划下线时间变化
  const handleScheduledArchiveAtChange = (value: string | null) => {
    setScheduledArchiveAt(value)
  }

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // 处理取消
  const handleCancel = () => {
    router.push('/admin/content')
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !content) {
      setError('标题和内容不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPage({
        title,
        content,
        excerpt: excerpt || extractExcerpt(content),
        status,
        categoryId,
        tagIds: selectedTagIds,
        featured,
        scheduledPublishAt,
        scheduledArchiveAt,
      })

      if (result.success) {
        // 跳转到内容详情页
        router.push(`/admin/content/${result.data.uuid}`)
      } else {
        setError(result.error?.message || '创建内容失败')
      }
    } catch (error) {
      console.error('创建内容失败:', error)
      setError((error as Error).message || '创建内容失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mounted,
    title,
    content,
    excerpt,
    categoryId,
    status,
    featured,
    scheduledPublishAt,
    scheduledArchiveAt,
    selectedTagIds,
    isSubmitting,
    error,
    categories: categoriesData?.success ? (categoriesData.data as any)?.items || categoriesData.data || [] : [],
    tags: tagsData?.success ? (tagsData.data as any)?.items || tagsData.data || [] : [],
    handleTitleChange,
    handleContentChange,
    handleExcerptChange,
    handleCategoryChange,
    handleStatusChange,
    handleFeaturedChange,
    handleScheduledPublishAtChange,
    handleScheduledArchiveAtChange,
    handleTagSelect,
    handleCancel,
    handleSubmit,
  }
}
