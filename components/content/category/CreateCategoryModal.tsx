import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Category } from '@/stores/contentStore'

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
}

/**
 * 创建分类模态框组件
 * 用于创建新的内容分类
 */
export default function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categories
}: CreateCategoryModalProps) {
  // 表单状态
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('')
  const [newCategoryOrder, setNewCategoryOrder] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API调用
  const { post: createCategory, loading: createLoading } = useMutation('/api/v1/categories')

  // 处理创建分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategoryName) {
      setError('分类名称不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createCategory({
        name: newCategoryName,
        slug: newCategorySlug || undefined,
        description: newCategoryDescription || undefined,
        parentId: newCategoryParentId ? parseInt(newCategoryParentId) : null,
        order: newCategoryOrder,
      })

      if (result.success) {
        // 重置表单
        resetForm()

        // 关闭模态框
        onClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '创建分类失败')
      }
    } catch (error) {
      console.error('创建分类失败:', error)
      setError((error as Error).message || '创建分类失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setNewCategoryName('')
    setNewCategorySlug('')
    setNewCategoryDescription('')
    setNewCategoryParentId('')
    setNewCategoryOrder(0)
    setError(null)
  }

  // 处理关闭模态框
  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="创建分类"
    >
      <form onSubmit={handleCreateCategory}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类名称 <span className="text-error-500">*</span>
              </label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="输入分类名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                别名（可选）
              </label>
              <Input
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
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
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="输入分类描述"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                父分类（可选）
              </label>
              <Select
                value={newCategoryParentId}
                onChange={(e) => setNewCategoryParentId(e.target.value)}
                options={[
                  { value: '', label: '无父分类' },
                  ...(categories && categories.length > 0 ? categories.map(category => ({
                    value: category.id.toString(),
                    label: category.name
                  })) : [])
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <Input
                type="number"
                value={newCategoryOrder}
                onChange={(e) => setNewCategoryOrder(parseInt(e.target.value))}
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
            disabled={!newCategoryName}
          >
            创建
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
