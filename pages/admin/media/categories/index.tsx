import React, { useState } from 'react'

import { PlusIcon } from '@heroicons/react/24/outline'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import useSWR from 'swr'

import { fetcher } from '@/lib/fetcher'

import CategoryDeleteConfirm from '@/components/admin/CategoryDeleteConfirm'
import CategoryForm from '@/components/admin/CategoryForm'
import CategoryTree from '@/components/admin/CategoryTree'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  description: string | null
  slug: string
  parentId: number | null
  children?: MediaCategory[]
  createdAt: string
  updatedAt: string
}

// CategoryTree组件已移至 @/components/admin/CategoryTree

const MediaCategoriesPage: React.FC = () => {
  const { data, error, mutate } = useSWR<MediaCategory[]>('/api/v1/media/categories', fetcher)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<MediaCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // 如果是名称字段，自动生成slug
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = '分类名称不能为空'
    if (!formData.slug.trim()) errors.slug = '分类别名不能为空'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateCategory = async () => {
    if (!validateForm()) return

    try {
      const response = await fetch('/api/v1/media/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({ name: '', description: '', slug: '', parentId: '' })
        mutate()
      } else {
        const error = await response.json()
        setFormErrors({ submit: error.message || '创建分类失败' })
      }
    } catch (error) {
      setFormErrors({ submit: '创建分类失败' })
    }
  }

  const handleEditCategory = async () => {
    if (!currentCategory || !validateForm()) return

    try {
      const response = await fetch(`/api/v1/media/categories/${currentCategory.uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setCurrentCategory(null)
        mutate()
      } else {
        const error = await response.json()
        setFormErrors({ submit: error.message || '更新分类失败' })
      }
    } catch (error) {
      setFormErrors({ submit: '更新分类失败' })
    }
  }

  const handleDeleteCategory = async () => {
    if (!currentCategory) return

    try {
      const response = await fetch(`/api/v1/media/categories/${currentCategory.uuid}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsDeleteModalOpen(false)
        setCurrentCategory(null)
        mutate()
      } else {
        const error = await response.json()
        alert(error.message || '删除分类失败')
      }
    } catch (error) {
      alert('删除分类失败')
    }
  }

  const openEditModal = (category: MediaCategory) => {
    setCurrentCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      parentId: category.parentId ? String(category.parentId) : ''
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (category: MediaCategory) => {
    setCurrentCategory(category)
    setIsDeleteModalOpen(true)
  }

  // 构建分类树
  const buildCategoryTree = (categories: MediaCategory[] = []): MediaCategory[] => {
    const categoryMap: Record<number, MediaCategory> = {}
    const rootCategories: MediaCategory[] = []

    // 首先创建一个以ID为键的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] }
    })

    // 然后构建树结构
    categories.forEach(category => {
      if (category.parentId === null) {
        rootCategories.push(categoryMap[category.id])
      } else if (categoryMap[category.parentId]) {
        if (!categoryMap[category.parentId].children) {
          categoryMap[category.parentId].children = []
        }
        categoryMap[category.parentId].children!.push(categoryMap[category.id])
      }
    })

    return rootCategories
  }

  const categoryTree = data ? buildCategoryTree(data) : []

  return (
    <AdminLayout title="媒体分类管理">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">媒体分类管理</h1>
          <Button
            onClick={() => {
              setFormData({ name: '', description: '', slug: '', parentId: '' })
              setFormErrors({})
              setIsCreateModalOpen(true)
            }}
            className="flex items-center"
          >
            <PlusIcon className="mr-1 h-5 w-5" />
            添加分类
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            加载分类失败: {error.message}
          </Alert>
        )}

        {!data && !error ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : data && data.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">暂无媒体分类，请点击&ldquo;添加分类&rdquo;按钮创建</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <CategoryTree
              categories={categoryTree}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          </div>
        )}
      </div>

      {/* 创建分类模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="添加媒体分类"
      >
        <CategoryForm
          formData={formData}
          formErrors={formErrors}
          categories={data}
          onInputChange={handleInputChange}
          onSubmit={handleCreateCategory}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 编辑分类模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑媒体分类"
      >
        <CategoryForm
          formData={formData}
          formErrors={formErrors}
          categories={data}
          currentCategory={currentCategory}
          isEdit={true}
          onInputChange={handleInputChange}
          onSubmit={handleEditCategory}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除媒体分类"
      >
        <CategoryDeleteConfirm
          category={currentCategory}
          onConfirm={handleDeleteCategory}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </Modal>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/media/categories',
        permanent: false,
      },
    }
  }

  // 检查用户权限
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
    return {
      redirect: {
        destination: '/403',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default MediaCategoriesPage
