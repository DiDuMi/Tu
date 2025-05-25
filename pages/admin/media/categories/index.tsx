import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import React, { useState } from 'react'
import useSWR from 'swr'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { fetcher } from '@/lib/fetcher'

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

interface CategoryTreeProps {
  categories: MediaCategory[]
  level?: number
  onEdit: (_category: MediaCategory) => void
  onDelete: (_category: MediaCategory) => void
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  level = 0,
  onEdit,
  onDelete
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleExpand = (uuid: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [uuid]: !prev[uuid]
    }))
  }

  return (
    <ul className={`pl-${level > 0 ? 4 : 0}`}>
      {categories.map(category => (
        <li key={category.uuid} className="py-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center">
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleExpand(category.uuid)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {expandedCategories[category.uuid] ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="ml-6"></span>
              )}
              <span className="font-medium">{category.name}</span>
              {category.description && (
                <span className="ml-2 text-sm text-gray-500">({category.description})</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(category)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(category)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {category.children && category.children.length > 0 && expandedCategories[category.uuid] && (
            <CategoryTree
              categories={category.children}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

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
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">分类名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">分类别名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">用于URL，只能包含小写字母、数字和连字符</p>
            {formErrors.slug && <p className="mt-1 text-sm text-red-500">{formErrors.slug}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">父分类</label>
            <select
              name="parentId"
              value={formData.parentId}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">无 (顶级分类)</option>
              {data?.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formErrors.submit && (
            <Alert variant="error">{formErrors.submit}</Alert>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCategory}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑分类模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑媒体分类"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">分类名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">分类别名 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">用于URL，只能包含小写字母、数字和连字符</p>
            {formErrors.slug && <p className="mt-1 text-sm text-red-500">{formErrors.slug}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">父分类</label>
            <select
              name="parentId"
              value={formData.parentId}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="">无 (顶级分类)</option>
              {data?.filter(c => c.id !== currentCategory?.id).map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {formErrors.submit && (
            <Alert variant="error">{formErrors.submit}</Alert>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditCategory}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除媒体分类"
      >
        <div className="space-y-4">
          <p>确定要删除分类 &ldquo;{currentCategory?.name}&rdquo; 吗？</p>
          <p className="text-sm text-red-500">
            注意：如果该分类下有子分类或媒体文件，将无法删除。
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteCategory}>
              删除
            </Button>
          </div>
        </div>
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
