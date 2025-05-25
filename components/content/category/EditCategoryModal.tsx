import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Category } from '@/stores/contentStore'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category: Category | null
  allCategories: Category[]
}

/**
 * 编辑分类模态框组件
 * 用于编辑现有的内容分类
 */
export default function EditCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  allCategories
}: EditCategoryModalProps) {
  // 表单状态
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategorySlug, setEditCategorySlug] = useState('')
  const [editCategoryDescription, setEditCategoryDescription] = useState('')
  const [editCategoryParentId, setEditCategoryParentId] = useState<string>('')
  const [editCategoryOrder, setEditCategoryOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API调用 - 动态构建URL
  const { put: updateCategoryBase, loading: updateLoading } = useMutation<{ uuid: string }>('/api/v1/categories')

  // 当分类变化时，更新表单状态
  useEffect(() => {
    if (category) {
      setEditCategoryName(category.name)
      setEditCategorySlug(category.slug)
      setEditCategoryDescription(category.description || '')
      setEditCategoryParentId(category.parentId ? category.parentId.toString() : '')
      setEditCategoryOrder(category.order)
    }
  }, [category])

  // 处理编辑分类
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editCategoryName || !category) {
      setError('分类名称不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 使用fetch直接调用API，因为useMutation不支持动态URL
      const response = await fetch(`/api/v1/categories/${category.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editCategoryName,
          slug: editCategorySlug || undefined,
          description: editCategoryDescription || undefined,
          parentId: editCategoryParentId ? parseInt(editCategoryParentId) : null,
          order: editCategoryOrder,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 关闭模态框
        onClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '更新分类失败')
      }
    } catch (error) {
      console.error('更新分类失败:', error)
      setError((error as Error).message || '更新分类失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理关闭模态框
  const handleClose = () => {
    // 重置错误状态
    setError(null)

    // 关闭模态框
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="编辑分类"
    >
      <form onSubmit={handleEditCategory}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类名称 <span className="text-error-500">*</span>
              </label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="输入分类名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                别名（可选）
              </label>
              <Input
                value={editCategorySlug}
                onChange={(e) => setEditCategorySlug(e.target.value)}
                placeholder="输入分类别名，用于URL"
              />
              <p className="mt-1 text-xs text-gray-500">
                如不填写，将自动根据名称生成
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述（可选）
              </label>
              <Textarea
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
                placeholder="输入分类描述"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                父分类（可选）
              </label>
              <Select
                value={editCategoryParentId}
                onChange={(e) => setEditCategoryParentId(e.target.value)}
                options={[
                  { value: '', label: '无父分类' },
                  ...(allCategories && allCategories.length > 0
                    ? allCategories
                        .filter(c => c.id !== category?.id)
                        .map(c => ({
                          value: c.id.toString(),
                          label: c.name
                        }))
                    : [])
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <Input
                type="number"
                value={editCategoryOrder}
                onChange={(e) => setEditCategoryOrder(parseInt(e.target.value))}
                min={0}
              />
              <p className="mt-1 text-xs text-gray-500">
                数字越小排序越靠前
              </p>
            </div>

            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!editCategoryName}
          >
            保存
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
