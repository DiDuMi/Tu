import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { fetcher } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TinyMCEEditor from '@/components/content/TinyMCEEditor'
import CoverImageSelector from '@/components/content/CoverImageSelector'
import EnhancedTagSelector from '@/components/content/EnhancedTagSelector'
import ContentCreationProgress from '@/components/content/ContentCreationProgress'
import AutoSaveIndicator from '@/components/content/AutoSaveIndicator'
import KeyboardShortcuts from '@/components/content/KeyboardShortcuts'
import EditorTemplateButton from '@/components/content/templates/EditorTemplateButton'
import LinkTemplateModal from '@/components/editor/LinkTemplateModal'
import BatchUploadButton from '@/components/content/BatchUploadButton'
import MediaSortButton from '@/components/content/MediaSortButton'
import BatchUploadDialog from '@/components/content/BatchUploadDialog'

import { useAutoSave } from '@/hooks/useAutoSave'
import { clearContentCache } from '@/lib/cache-utils'

export default function EditContent() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // 表单状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [coverImage, setCoverImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 编辑器相关状态
  const [editorRef, setEditorRef] = useState<any>(null)

  // 链接模板状态
  const [isLinkTemplateModalOpen, setIsLinkTemplateModalOpen] = useState(false)

  // 批量上传状态
  const [showBatchUpload, setShowBatchUpload] = useState(false)



  // 自动保存功能
  const autoSaveData = {
    title,
    content,
    excerpt,
    categoryId,
    selectedTagIds,
    coverImage
  }

  const handleAutoSave = async (data: typeof autoSaveData) => {
    // 只有在有基本内容时才自动保存
    if (!data.title.trim() && !data.content.trim()) {
      return
    }

    try {
      await fetch(`/api/v1/pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title || '未命名内容',
          content: data.content,
          excerpt: data.excerpt || undefined,
          categoryId: data.categoryId ? parseInt(data.categoryId, 10) : undefined,
          tagIds: data.selectedTagIds.length > 0 ? data.selectedTagIds : undefined,
          coverImage: data.coverImage || undefined,
        }),
      })
    } catch (error) {
      console.error('Auto save failed:', error)
      throw error
    }
  }

  const {
    isSaving: isAutoSaving,
    lastSaved,
    saveError,
    saveNow,
    getLastSavedText
  } = useAutoSave(autoSaveData, {
    onSave: handleAutoSave,
    enabled: !!session && !!id,
    delay: 5000 // 5秒延迟
  })

  // 获取内容详情
  const { data: contentData, error: contentError } = useSWR(
    id && session ? `/api/v1/pages/${id}` : null,
    fetcher
  )

  // 获取分类列表
  const { data: categoriesData, error: categoriesError } = useSWR(
    session ? '/api/v1/categories' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5秒内不重复请求
      errorRetryCount: 3, // 错误时重试3次
      onError: (err) => console.error('加载分类失败:', err)
    }
  )

  // 处理分类数据，确保格式一致
  let categories = []
  if (categoriesData?.success && categoriesData?.data) {
    // 如果数据是数组，直接使用
    if (Array.isArray(categoriesData.data)) {
      categories = categoriesData.data
    }
    // 如果数据包含items字段，使用items
    else if (categoriesData.data.items && Array.isArray(categoriesData.data.items)) {
      categories = categoriesData.data.items
    }
  }

  // 如果加载分类出错，在控制台显示错误
  useEffect(() => {
    if (categoriesError) {
      console.error('加载分类出错:', categoriesError)
    }
  }, [categoriesError])

  // 获取标签列表
  const { data: tagsData } = useSWR(
    session ? '/api/v1/tags' : null,
    fetcher
  )

  const tags = tagsData?.data?.items || []

  // 初始化表单数据
  useEffect(() => {
    if (contentData?.data) {
      const { title, content, excerpt, categoryId, coverImage, pageTags } = contentData.data
      setTitle(title || '')
      setContent(content || '')
      setExcerpt(excerpt || '')
      setCategoryId(categoryId ? categoryId.toString() : '')
      setCoverImage(coverImage || '')

      // 设置已选标签
      if (pageTags && Array.isArray(pageTags)) {
        setSelectedTagIds(pageTags.map((tag: any) => tag.tagId))
      }
    }
  }, [contentData])

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }

  // 处理模板插入
  const handleInsertTemplate = (templateContent: string, position: 'top' | 'cursor' | 'bottom') => {
    if (!editorRef) {
      // 如果编辑器引用不可用，直接根据位置插入
      switch (position) {
        case 'top':
          setContent(templateContent + '\n\n' + content)
          break
        case 'bottom':
          setContent(content + '\n\n' + templateContent)
          break
        case 'cursor':
        default:
          setContent(content + '\n\n' + templateContent)
          break
      }
      return
    }

    // 使用TinyMCE API插入内容
    try {
      switch (position) {
        case 'top':
          editorRef.setContent(templateContent + '\n\n' + editorRef.getContent())
          break
        case 'bottom':
          editorRef.setContent(editorRef.getContent() + '\n\n' + templateContent)
          break
        case 'cursor':
        default:
          editorRef.insertContent('\n\n' + templateContent)
          break
      }
    } catch (error) {
      console.error('插入模板失败:', error)
      // 降级到直接设置内容
      setContent(content + '\n\n' + templateContent)
    }
  }

  // 处理批量上传
  const handleBatchUpload = () => {
    setShowBatchUpload(true)
  }

  // 处理批量上传完成
  const handleBatchUploadComplete = (mediaList: any[]) => {
    if (editorRef && mediaList.length > 0) {
      // 将上传的媒体插入到编辑器中
      const mediaHtml = mediaList.map(media => {
        console.log('处理媒体:', media) // 调试日志

        // API返回的媒体类型是大写的 IMAGE, VIDEO, AUDIO
        if (media.type === 'IMAGE') {
          return `<img src="${media.url}" alt="${media.title || media.name || '图片'}" style="max-width: 100%; height: auto;" />`
        } else if (media.type === 'VIDEO') {
          return `<video controls style="max-width: 100%; height: auto;"><source src="${media.url}" type="${media.mimeType || 'video/mp4'}">您的浏览器不支持视频播放。</video>`
        } else if (media.type === 'AUDIO') {
          return `<audio controls><source src="${media.url}" type="${media.mimeType || 'audio/mpeg'}">您的浏览器不支持音频播放。</audio>`
        }
        return ''
      }).filter(html => html !== '').join('<br><br>')

      if (mediaHtml) {
        editorRef.insertContent('<br><br>' + mediaHtml)
      }
    }
    setShowBatchUpload(false)
  }



  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('表单提交被触发', e.target, e.currentTarget)
    e.preventDefault()

    if (!title.trim()) {
      setError('标题不能为空')
      return
    }

    if (!content.trim()) {
      setError('内容不能为空')
      return
    }

    if (!categoryId) {
      setError('请选择分类')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          categoryId: parseInt(categoryId, 10),
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          coverImage: coverImage || undefined,
        }),
      })

      if (response.ok) {
        // 清除相关缓存，确保前台页面能看到更新
        await clearContentCache(id as string)

        router.push('/dashboard/contents')
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || errorData.message || '更新内容失败')
      }
    } catch (error) {
      console.error('更新内容时出错:', error)
      setError('更新内容时发生错误')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理取消
  const handleCancel = () => {
    router.push('/dashboard/contents')
  }

  // 处理发布
  const handlePublish = async () => {
    if (!confirm('确定要提交审核吗？提交后内容将进入审核流程。')) {
      return
    }

    // 先保存当前内容
    if (!title.trim()) {
      setError('标题不能为空')
      return
    }

    if (!content.trim()) {
      setError('内容不能为空')
      return
    }

    if (!categoryId) {
      setError('请选择分类')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 先更新内容
      const updateResponse = await fetch(`/api/v1/pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          categoryId: parseInt(categoryId, 10),
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          coverImage: coverImage || undefined,
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        setError(errorData.error?.message || errorData.message || '保存内容失败')
        return
      }

      // 然后更新状态为审核中
      const statusResponse = await fetch(`/api/v1/pages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REVIEW',
        }),
      })

      if (statusResponse.ok) {
        // 清除相关缓存
        await clearContentCache(id as string)
        router.push('/dashboard/contents')
      } else {
        const errorData = await statusResponse.json()
        setError(errorData.error?.message || errorData.message || '提交审核失败')
      }
    } catch (error) {
      console.error('提交审核时出错:', error)
      setError('提交审核时发生错误')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin?callbackUrl=/dashboard/contents')
    }
  }, [session, isLoading, router])

  // 如果内容不存在或不属于当前用户
  if (contentError) {
    return (
      <DashboardLayout title="内容不存在 - 兔图">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">内容不存在或无权访问</h1>
            <Button onClick={() => router.push('/dashboard/contents')}>
              返回我的内容
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading || !session || !contentData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <DashboardLayout title="编辑内容 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">编辑内容</h1>
          <p className="mt-1 text-gray-500">修改您的内容</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form id="content-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* 主要内容区域 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息卡片 */}
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                  </div>

                  <div className="space-y-5">
                    {/* 标题 */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        标题 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="输入内容标题，使用 #标签 格式添加标签"
                        className="mt-2"
                        fullWidth
                        required
                      />
                      <p className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        提示：在标题中使用 #标签 格式可以添加标签，例如：三度 - #鸣潮 #长离
                      </p>
                    </div>

                    {/* 摘要 */}
                    <div>
                      <Label htmlFor="excerpt" className="text-sm font-medium text-gray-700">
                        摘要（可选）
                      </Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="输入内容摘要，用于在列表页面和搜索结果中显示内容简介"
                        className="mt-2"
                        rows={3}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        摘要用于在内容列表、搜索结果和分享预览中显示内容简介。如果不填写，系统将自动从正文内容中提取前200个字符作为摘要。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内容编辑器卡片 */}
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">内容编辑</h3>
                    </div>

                    {/* 编辑器工具栏 */}
                    <div className="flex items-center space-x-3">
                      {/* 批量上传按钮 */}
                      <BatchUploadButton
                        onClick={handleBatchUpload}
                      />

                      {/* 媒体排序按钮 */}
                      <MediaSortButton
                        editorRef={{ current: editorRef }}
                      />

                      {/* 预设模板按钮 */}
                      <EditorTemplateButton
                        onInsertTemplate={handleInsertTemplate}
                        title={title}
                        enableSmartRecommendation={true}
                      />

                      {/* 链接模板按钮 */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLinkTemplateModalOpen(true)}
                        className="flex items-center gap-2"
                        title="管理下载链接"
                      >
                        <span>🔗</span>
                        链接模板
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <TinyMCEEditor
                      value={content}
                      onChange={setContent}
                      height={500}
                      placeholder="输入内容正文..."
                      onInit={(editor) => setEditorRef(editor)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 侧边栏设置区域 */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* 自动保存状态 */}
              <AutoSaveIndicator
                isSaving={isAutoSaving}
                lastSaved={lastSaved}
                saveError={saveError}
                getLastSavedText={getLastSavedText}
                onSaveNow={saveNow}
              />

              {/* 进度指示器 */}
              <ContentCreationProgress
                title={title}
                content={content}
                categoryId={categoryId}
                coverImage={coverImage}
                selectedTagIds={selectedTagIds}
              />

              {/* 发布设置卡片 */}
              <Card className="shadow-sm border border-gray-200 lg:sticky lg:top-6">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-900">发布设置</h3>
                  </div>

                  <div className="space-y-5">
                    {/* 分类选择 */}
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                        分类 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="mt-2"
                        required
                        error={categoriesError ? "加载分类失败，请刷新页面重试" : undefined}
                      >
                        <option value="">选择分类</option>
                        {categories && categories.length > 0 ? (
                          categories.map((category: any) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))
                        ) : !categoriesError ? (
                          <option value="" disabled>加载分类中...</option>
                        ) : null}
                      </Select>
                      {categoriesError && (
                        <p className="mt-2 text-xs text-red-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          加载分类失败: {categoriesError.message || '未知错误'}
                        </p>
                      )}
                      {!categoriesError && (!categories || categories.length === 0) && (
                        <p className="mt-2 text-xs text-amber-500 flex items-center">
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          正在加载分类，请稍候...
                        </p>
                      )}
                    </div>

                    {/* 标签选择 */}
                    <EnhancedTagSelector
                      tags={tags}
                      selectedTagIds={selectedTagIds}
                      onTagSelect={handleTagSelect}
                    />

                    {/* 封面图片 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">封面图片</Label>
                      <div className="mt-2">
                        <CoverImageSelector
                          currentCover={coverImage}
                          onCoverSelect={setCoverImage}
                          editorContent={content}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        可以从媒体库选择，或从编辑器内容中选择图片作为封面。
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="order-2 sm:order-1"
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="order-3 sm:order-2"
                        >
                          {isSubmitting ? '保存中...' : '保存'}
                        </Button>
                        {contentData?.data?.status === 'DRAFT' && (
                          <Button
                            type="button"
                            onClick={handlePublish}
                            disabled={isSubmitting}
                            className="order-1 sm:order-3 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                提交中...
                              </>
                            ) : (
                              '提交审核'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        {/* 键盘快捷键 */}
        <KeyboardShortcuts
          onSave={() => saveNow()}
          onPublish={contentData?.data?.status === 'DRAFT' ? handlePublish : undefined}
        />

        {/* 链接模板模态框 */}
        {id && typeof id === 'string' && (
          <LinkTemplateModal
            isOpen={isLinkTemplateModalOpen}
            onClose={() => setIsLinkTemplateModalOpen(false)}
            pageId={id}
            onLinksUpdated={() => {
              // 可以在这里添加链接更新后的处理逻辑
              console.log('下载链接已更新')
            }}
          />
        )}

        {/* 批量上传对话框 */}
        <BatchUploadDialog
          isOpen={showBatchUpload}
          onClose={() => setShowBatchUpload(false)}
          onUploadComplete={handleBatchUploadComplete}
        />

      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/contents',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
