import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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

interface MediaTag {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

const MediaTagsPage: React.FC = () => {
  const { data, error, mutate } = useSWR<MediaTag[]>('/api/v1/media/tags', fetcher)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentTag, setCurrentTag] = useState<MediaTag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6' // 默认蓝色
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = '标签名称不能为空'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTag = async () => {
    if (!validateForm()) return

    try {
      const response = await fetch('/api/v1/media/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({ name: '', description: '', color: '#3B82F6' })
        mutate()
      } else {
        const error = await response.json()
        setFormErrors({ submit: error.message || '创建标签失败' })
      }
    } catch (error) {
      setFormErrors({ submit: '创建标签失败' })
    }
  }

  const handleEditTag = async () => {
    if (!currentTag || !validateForm()) return

    try {
      const response = await fetch(`/api/v1/media/tags/${currentTag.uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setCurrentTag(null)
        mutate()
      } else {
        const error = await response.json()
        setFormErrors({ submit: error.message || '更新标签失败' })
      }
    } catch (error) {
      setFormErrors({ submit: '更新标签失败' })
    }
  }

  const handleDeleteTag = async () => {
    if (!currentTag) return

    try {
      const response = await fetch(`/api/v1/media/tags/${currentTag.uuid}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIsDeleteModalOpen(false)
        setCurrentTag(null)
        mutate()
      } else {
        const error = await response.json()
        alert(error.message || '删除标签失败')
      }
    } catch (error) {
      alert('删除标签失败')
    }
  }

  const openEditModal = (tag: MediaTag) => {
    setCurrentTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#3B82F6'
    })
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (tag: MediaTag) => {
    setCurrentTag(tag)
    setIsDeleteModalOpen(true)
  }

  // 预定义的颜色选项
  const colorOptions = [
    { value: '#3B82F6', label: '蓝色' },
    { value: '#10B981', label: '绿色' },
    { value: '#F59E0B', label: '黄色' },
    { value: '#EF4444', label: '红色' },
    { value: '#8B5CF6', label: '紫色' },
    { value: '#EC4899', label: '粉色' },
    { value: '#6B7280', label: '灰色' },
    { value: '#000000', label: '黑色' }
  ]

  return (
    <AdminLayout title="媒体标签管理">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">媒体标签管理</h1>
          <Button
            onClick={() => {
              setFormData({ name: '', description: '', color: '#3B82F6' })
              setFormErrors({})
              setIsCreateModalOpen(true)
            }}
            className="flex items-center"
          >
            <PlusIcon className="mr-1 h-5 w-5" />
            添加标签
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            加载标签失败: {error.message}
          </Alert>
        )}

        {!data && !error ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : data && data.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">暂无媒体标签，请点击&ldquo;添加标签&rdquo;按钮创建</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      标签名称
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      颜色
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      描述
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      创建时间
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data?.map(tag => (
                    <tr key={tag.uuid}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className="mr-2 inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: tag.color || '#3B82F6' }}
                          ></span>
                          <span className="font-medium">{tag.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {tag.color || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tag.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(tag.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(tag)}
                          className="mr-3 text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(tag)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 创建标签模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="添加媒体标签"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">标签名称 <span className="text-red-500">*</span></label>
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
            <label className="mb-1 block text-sm font-medium">标签颜色</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 ${formData.color === color.value ? 'border-black' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="h-8 w-8 cursor-pointer rounded-full border-0"
                title="自定义颜色"
              />
            </div>
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

          {formErrors.submit && (
            <Alert variant="error">{formErrors.submit}</Alert>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateTag}>
              创建
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑标签模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑媒体标签"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">标签名称 <span className="text-red-500">*</span></label>
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
            <label className="mb-1 block text-sm font-medium">标签颜色</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 ${formData.color === color.value ? 'border-black' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="h-8 w-8 cursor-pointer rounded-full border-0"
                title="自定义颜色"
              />
            </div>
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

          {formErrors.submit && (
            <Alert variant="error">{formErrors.submit}</Alert>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditTag}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除媒体标签"
      >
        <div className="space-y-4">
          <p>确定要删除标签 &ldquo;{currentTag?.name}&rdquo; 吗？</p>
          <p className="text-sm text-red-500">
            注意：如果该标签已被媒体文件使用，将无法删除。
          </p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteTag}>
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
        destination: '/auth/signin?callbackUrl=/admin/media/tags',
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

export default MediaTagsPage
