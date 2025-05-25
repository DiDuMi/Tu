import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useState } from 'react'
import useSWR from 'swr'

import { DeleteContentModal } from '@/components/content'
import ContentStatusActions from '@/components/content/ContentStatusActions'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { fetcher } from '@/lib/api'
import { ContentStatus } from '@/lib/content-workflow'
import { formatDate } from '@/lib/date'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function ContentDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // 获取内容详情
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/content/${id}` : null,
    fetcher
  )

  // 处理删除内容
  const handleDelete = () => {
    setDeleteModalOpen(true)
  }

  // 处理删除成功
  const handleDeleteSuccess = () => {
    router.push('/admin/content')
  }

  // 处理状态变更
  const handleStatusChange = () => {
    mutate() // 重新获取内容数据
  }

  if (isLoading) {
    return (
      <AdminLayout title="内容详情 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="内容详情 - 兔图管理后台">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">加载内容失败</h2>
          <p className="text-gray-500 mb-6">
            {error?.message || data?.error?.message || '无法加载内容详情'}
          </p>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </AdminLayout>
    )
  }

  const content = data.data

  return (
    <AdminLayout title={`${content.title} - 内容详情 - 兔图管理后台`}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            ID: {content.id} | UUID: {content.uuid}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Link href={`/admin/content/${id}/edit`}>
            <Button variant="outline">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              编辑
            </Button>
          </Link>
          <Button variant="error" onClick={handleDelete}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            删除
          </Button>
          <Link href={`/pages/${content.uuid}`} target="_blank">
            <Button>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              查看
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">内容详情</h2>

              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: content.content }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">状态管理</h2>
              <ContentStatusActions
                contentId={content.id}
                currentStatus={content.status as ContentStatus}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">元数据</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">作者</h3>
                  <p className="mt-1">{content.user?.name || '未知'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">分类</h3>
                  <p className="mt-1">{content.category?.name || '无分类'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">标签</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {content.tags && content.tags.length > 0 ? (
                      content.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-dark-muted">无标签</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">创建时间</h3>
                  <p className="mt-1">{formatDate(content.createdAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">更新时间</h3>
                  <p className="mt-1">{formatDate(content.updatedAt)}</p>
                </div>

                {content.publishedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">发布时间</h3>
                    <p className="mt-1">{formatDate(content.publishedAt)}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-dark-muted">浏览次数</h3>
                  <p className="mt-1">{content.viewCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteContentModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        page={content}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || !(isAdmin(session) || isOperator(session))) {
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
