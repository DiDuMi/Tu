import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'

import {
  CreateCategoryModal,
  EditCategoryModal,
  DeleteCategoryModal,
  CategoryTree
} from '@/components/content/category'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { useCategoryManagement } from '@/hooks/useCategoryManagement'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function CategoryManagement() {
  // 使用自定义Hook管理分类
  const {
    mounted,
    createModalOpen,
    editModalOpen,
    deleteModalOpen,
    selectedCategory,
    categoryTree,
    categories,
    categoriesIsLoading,
    categoriesError,
    categoriesSearchTerm,
    handleSearchChange,
    handleOpenCreateModal,
    handleEditCategory,
    handleDeleteCategory,
    handleModalClose,
    handleSuccess,
  } = useCategoryManagement()

  if (!mounted) return null

  return (
    <AdminLayout title="分类管理 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理内容分类
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleOpenCreateModal}>
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
            创建分类
          </Button>
        </div>
      </div>

      {/* 分类树列表 */}
      <CategoryTree
        categories={categoryTree}
        isLoading={categoriesIsLoading}
        error={categoriesError}
        searchTerm={categoriesSearchTerm}
        onSearchChange={handleSearchChange}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />

      {/* 创建分类模态框 */}
      <CreateCategoryModal
        isOpen={createModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        categories={categories}
      />

      {/* 编辑分类模态框 */}
      <EditCategoryModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        category={selectedCategory}
        allCategories={categories}
      />

      {/* 删除确认模态框 */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        category={selectedCategory}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || !(isAdmin(session) || isOperator(session))) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/content/categories',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
