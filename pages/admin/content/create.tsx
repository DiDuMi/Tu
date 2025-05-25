import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'

import { ContentForm } from '@/components/content/form'
import AdminLayout from '@/components/layout/AdminLayout'
import { useContentCreation } from '@/hooks/useContentCreation'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function CreateContent() {
  // 使用自定义Hook管理内容创建
  const {
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
    categories,
    tags,
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
  } = useContentCreation()

  if (!mounted) return null

  return (
    <AdminLayout title="创建内容 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">创建内容</h1>
        <p className="mt-1 text-sm text-gray-500">
          创建新的内容页面
        </p>
      </div>

      <ContentForm
        title={title}
        content={content}
        excerpt={excerpt}
        categoryId={categoryId}
        status={status}
        featured={featured}
        scheduledPublishAt={scheduledPublishAt}
        scheduledArchiveAt={scheduledArchiveAt}
        selectedTagIds={selectedTagIds}
        categories={categories}
        tags={tags}
        isSubmitting={isSubmitting}
        error={error}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        onExcerptChange={handleExcerptChange}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onFeaturedChange={handleFeaturedChange}
        onScheduledPublishAtChange={handleScheduledPublishAtChange}
        onScheduledArchiveAtChange={handleScheduledArchiveAtChange}
        onTagSelect={handleTagSelect}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/content/create',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
