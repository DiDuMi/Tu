import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'

import EditContentForm from '@/components/content/form/EditContentForm'
import AdminLayout from '@/components/layout/AdminLayout'
import { useFetch, useMutation } from '@/hooks/useFetch'
import { extractTagsFromTitle } from '@/lib/content'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useContentStore, Category, Tag } from '@/stores/contentStore'

export default function EditContent() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_showAdvanced, _setShowAdvanced] = useState(false)
  const [extractedTags, setExtractedTags] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  // 从状态管理中获取编辑状态
  const {
    selectedPage,
    editingPage,
    editingTitle,
    editingContent,
    editingExcerpt,
    editingCategoryId,
    editingStatus,
    editingFeatured,
    editingScheduledPublishAt,
    editingScheduledArchiveAt,
    editingChangeLog,
    setSelectedPage,
    setEditingTitle,
    setEditingContent,
    setEditingExcerpt,
    setEditingCategoryId,
    setEditingStatus,
    setEditingFeatured,
    setEditingScheduledPublishAt,
    setEditingScheduledArchiveAt,
    setEditingChangeLog,
    initializeEditingPage,
    resetEditingState,
  } = useContentStore()

  // 获取内容详情
  const { } = useFetch(
    mounted && id ? `/api/v1/pages/${id}` : null,
    {
      onSuccess: (data) => {
        if (data?.success) {
          setSelectedPage(data.data)

          // 初始化编辑状态
          if (!editingPage) {
            initializeEditingPage(data.data)

            // 初始化选中的标签
            if (data.data.tags) {
              setSelectedTagIds(data.data.tags.map((tag: any) => tag.id))
            }
          }
        }
      },
    }
  )

  // 获取分类列表
  const { data: categoriesData } = useFetch<{ success: boolean, data: { items: Category[] } }>(
    mounted ? '/api/v1/categories?limit=100' : null
  )

  // 获取标签列表
  const { data: tagsData } = useFetch<{ success: boolean, data: { items: Tag[] } }>(
    mounted ? '/api/v1/tags?limit=100' : null
  )

  // 更新内容的API调用
  const { put: updatePage } = useMutation(`/api/v1/pages/${id}`)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)

    // 组件卸载时重置编辑状态
    return () => {
      resetEditingState()
    }
  }, [resetEditingState])

  // 处理标题变化，提取标签
  useEffect(() => {
    if (editingTitle) {
      const { tags } = extractTagsFromTitle(editingTitle)
      setExtractedTags(tags)
    } else {
      setExtractedTags([])
    }
  }, [editingTitle])

  // 处理表单提交
  const handleSubmit = async (data: any) => {
    if (!data.title || !data.content) {
      setError('标题和内容不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await updatePage(data)

      if (result.success) {
        // 重置编辑状态
        resetEditingState()

        // 跳转到内容详情页
        router.push(`/admin/content/${id}`)
      } else {
        setError(result.error?.message || '更新内容失败')
      }
    } catch (error) {
      console.error('更新内容失败:', error)
      setError((error as Error).message || '更新内容失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (!mounted) return null

  return (
    <AdminLayout title="编辑内容 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">编辑内容</h1>
        <p className="mt-1 text-sm text-gray-500">
          编辑现有内容
        </p>
      </div>

      {!selectedPage ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <EditContentForm
          id={id as string}
          editingTitle={editingTitle}
          editingContent={editingContent}
          editingExcerpt={editingExcerpt}
          editingCategoryId={editingCategoryId}
          editingStatus={editingStatus}
          editingFeatured={editingFeatured}
          editingScheduledPublishAt={editingScheduledPublishAt}
          editingScheduledArchiveAt={editingScheduledArchiveAt}
          editingChangeLog={editingChangeLog}
          extractedTags={extractedTags}
          selectedTagIds={selectedTagIds}
          categories={categoriesData?.success ? (categoriesData.data as any)?.items || categoriesData.data || [] : []}
          tags={tagsData?.success ? (tagsData.data as any)?.items || tagsData.data || [] : []}
          isSubmitting={isSubmitting}
          error={error}
          onTitleChange={setEditingTitle}
          onContentChange={setEditingContent}
          onExcerptChange={setEditingExcerpt}
          onCategoryChange={setEditingCategoryId}
          onStatusChange={setEditingStatus}
          onFeaturedChange={setEditingFeatured}
          onScheduledPublishAtChange={setEditingScheduledPublishAt}
          onScheduledArchiveAtChange={setEditingScheduledArchiveAt}
          onChangeLogChange={setEditingChangeLog}
          onTagSelect={handleTagSelect}
          onSubmit={handleSubmit}
        />
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/content',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
