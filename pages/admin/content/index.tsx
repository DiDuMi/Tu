import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'

import {
  ContentList,
  ContentFilter,
  DeleteContentModal
} from '@/components/content'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { useContentManagement } from '@/hooks/useContentManagement'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function ContentPage() {
  // 使用自定义Hook管理内容
  const {
    mounted,
    deleteModalOpen,
    selectedPage,
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    status,
    categoryId,
    tagId,
    sortBy,
    sortDirection,
    categories,
    tags,
    handlePageChange,
    handleSearch,
    handleStatusChange,
    handleCategoryChange,
    handleTagChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleResetFilter,
    handleDeletePage,
    handleModalClose,
    handleSuccess,
  } = useContentManagement()

  if (!mounted) return null

  return (
    <AdminLayout title="内容管理 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统中的所有内容
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/admin/content/create">
            <Button>
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
              创建内容
            </Button>
          </Link>
        </div>
      </div>

      {/* 内容筛选 */}
      <ContentFilter
        searchTerm={searchTerm}
        status={status || ''}
        categoryId={categoryId?.toString() || ''}
        tagId={tagId?.toString() || ''}
        sortBy={sortBy}
        sortDirection={sortDirection}
        categories={categories}
        tags={tags}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onCategoryChange={handleCategoryChange}
        onTagChange={handleTagChange}
        onSortByChange={handleSortByChange}
        onSortDirectionChange={handleSortDirectionChange}
        onReset={handleResetFilter}
      />

      {/* 内容列表 */}
      <ContentList
        pages={pages}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onDelete={handleDeletePage}
      />

      {totalPages > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            共 {totalPages} 条记录，当前第 {currentPage} 页，每页 {pageSize} 条
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalPages / pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 删除确认模态框 */}
      <DeleteContentModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        page={selectedPage}
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
