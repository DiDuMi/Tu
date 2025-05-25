import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'

import { ReviewList, ReviewModal } from '@/components/content/review'
import AdminLayout from '@/components/layout/AdminLayout'
import { Input } from '@/components/ui/Input'
import { useReviewManagement } from '@/hooks/useReviewManagement'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function ContentReview() {
  // 使用自定义Hook管理审核
  const {
    mounted,
    reviewModalOpen,
    selectedPage,
    pages,
    totalPages,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    handlePageChange,
    handleSearchChange,
    handleReviewPage,
    handleModalClose,
    handleSuccess,
  } = useReviewManagement()

  if (!mounted) return null

  return (
    <AdminLayout title="内容审核 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容审核</h1>
          <p className="mt-1 text-sm text-gray-500">
            审核待发布的内容
          </p>
        </div>
        <div className="mt-4 sm:mt-0 w-64">
          <Input
            placeholder="搜索标题或内容..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 审核列表 */}
      <ReviewList
        pages={pages}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onReview={handleReviewPage}
      />

      {/* 审核模态框 */}
      <ReviewModal
        isOpen={reviewModalOpen}
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
        destination: '/auth/signin?callbackUrl=/admin/content/review',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
