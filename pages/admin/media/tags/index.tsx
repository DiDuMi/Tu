import React, { useState } from 'react'

import { PlusIcon } from '@heroicons/react/24/outline'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import useSWR from 'swr'

import { fetcher } from '@/lib/fetcher'

import TagDeleteConfirm from '@/components/admin/TagDeleteConfirm'
import TagForm from '@/components/admin/TagForm'
import TagTable from '@/components/admin/TagTable'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

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

  // 颜色选项已移至TagForm组件

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
            <TagTable
              tags={data || []}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          </div>
        )}
      </div>

      {/* 创建标签模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="添加媒体标签"
      >
        <TagForm
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
          onSubmit={handleCreateTag}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 编辑标签模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑媒体标签"
      >
        <TagForm
          formData={formData}
          formErrors={formErrors}
          isEdit={true}
          onInputChange={handleInputChange}
          onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
          onSubmit={handleEditTag}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="删除媒体标签"
      >
        <TagDeleteConfirm
          tag={currentTag}
          onConfirm={handleDeleteTag}
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
