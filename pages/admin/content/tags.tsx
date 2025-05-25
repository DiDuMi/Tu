import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'

import {
  CreateTagModal,
  EditTagModal,
  MergeTagModal,
  DeleteTagModal,
  TagList
} from '@/components/content/tag'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useContentStore, Tag } from '@/stores/contentStore'

export default function TagManagement() {
  const [mounted, setMounted] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)

  // 编辑和删除的标签
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)

  // 从状态管理中获取标签列表状态
  const {
    tags,
    totalTags,
    tagsCurrentPage,
    tagsPageSize,
    tagsIsLoading,
    tagsError,
    tagsSearchTerm,
    setTags,
    setTotalTags,
    setTagsCurrentPage,
    setTagsError,
    setTagsSearchTerm,
  } = useContentStore()

  // 获取标签列表
  const { mutate: refreshTags } = useFetch<{ success: boolean, data: { items: Tag[], pagination: any } }>(
    mounted ? `/api/v1/tags?page=${tagsCurrentPage}&limit=${tagsPageSize}&search=${tagsSearchTerm}&sortBy=useCount&sortDirection=desc` : null,
    {
      onSuccess: (data) => {
        if (data?.success) {
          setTags(data.data.items)
          setTotalTags(data.data.pagination.total)
        }
      },
      onError: (error) => {
        setTagsError(error.message)
      },
    }
  )

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setTagsCurrentPage(page)
  }

  // 处理搜索词变化
  const handleSearchChange = (value: string) => {
    setTagsSearchTerm(value)
  }

  // 打开编辑模态框
  const handleEditTag = (tag: Tag) => {
    setSelectedTag(tag)
    setEditModalOpen(true)
  }

  // 打开合并模态框
  const handleMergeTag = (tag: Tag) => {
    setSelectedTag(tag)
    setMergeModalOpen(true)
  }

  // 打开删除模态框
  const handleDeleteTag = (tag: Tag) => {
    setSelectedTag(tag)
    setDeleteModalOpen(true)
  }

  // 处理模态框关闭
  const handleModalClose = () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setMergeModalOpen(false)
    setDeleteModalOpen(false)
    setSelectedTag(null)
  }

  // 处理操作成功
  const handleSuccess = () => {
    refreshTags()
  }

  if (!mounted) return null

  return (
    <AdminLayout title="标签管理 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理内容标签
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setCreateModalOpen(true)}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            创建标签
          </Button>
        </div>
      </div>

      {/* 标签列表 */}
      <TagList
        tags={tags}
        totalTags={totalTags}
        currentPage={tagsCurrentPage}
        pageSize={tagsPageSize}
        isLoading={tagsIsLoading}
        error={tagsError}
        searchTerm={tagsSearchTerm}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onEdit={handleEditTag}
        onMerge={handleMergeTag}
        onDelete={handleDeleteTag}
      />

      {/* 创建标签模态框 */}
      <CreateTagModal
        isOpen={createModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      {/* 编辑标签模态框 */}
      <EditTagModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        tag={selectedTag}
      />

      {/* 合并标签模态框 */}
      <MergeTagModal
        isOpen={mergeModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        sourceTag={selectedTag}
        allTags={tags}
      />

      {/* 删除确认模态框 */}
      <DeleteTagModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        tag={selectedTag}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || !(isAdmin(session) || isOperator(session))) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/content/tags',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
