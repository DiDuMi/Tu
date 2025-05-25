import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Category } from '@/stores/contentStore'

interface DeleteCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  category: Category | null
}

/**
 * 删除分类确认模态框组件
 * 用于确认删除分类
 */
export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category
}: DeleteCategoryModalProps) {
  // 状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceDelete, setForceDelete] = useState(false)

  // API调用
  const { delete: deleteCategory, loading: deleteLoading } = useMutation<{ uuid: string }>('/api/v1/categories')

  // 处理删除分类
  const handleDeleteCategory = async () => {
    if (!category) return

    setIsSubmitting(true)
    setError(null)

    try {
      // 使用完整的API路径，包含分类ID，如果是强制删除则添加force参数
      const url = forceDelete
        ? `/api/v1/categories/${category.uuid}?force=true`
        : `/api/v1/categories/${category.uuid}`

      const result = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())

      if (result.success) {
        // 关闭模态框
        onClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '删除分类失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      setError((error as Error).message || '删除分类失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 检查是否可以删除分类
  const canDelete = () => {
    // 如果启用了强制删除，则始终可以删除
    if (forceDelete) return true
    // 否则，只有在没有子分类和关联内容时才能删除
    return !((category?._count?.children || 0) > 0 || (category?._count?.pages || 0) > 0)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认删除"
    >
      <ModalBody>
        <p>
          确定要删除分类 <strong>{category?.name}</strong> 吗？此操作不可撤销。
        </p>
        {(category?._count?.children || 0) > 0 && (
          <Alert variant="warning" className="mt-4">
            {forceDelete
              ? "强制删除将解除所有子分类与此分类的关联。"
              : "无法删除有子分类的分类，请先删除或移动子分类，或启用强制删除。"}
          </Alert>
        )}
        {(category?._count?.pages || 0) > 0 && (
          <Alert variant="warning" className="mt-4">
            {forceDelete
              ? `强制删除将解除 ${category?._count?.pages} 个内容与此分类的关联。`
              : "无法删除有关联内容的分类，请先移除内容的分类关联，或启用强制删除。"}
          </Alert>
        )}

        {/* 强制删除选项 */}
        {((category?._count?.children || 0) > 0 || (category?._count?.pages || 0) > 0) && (
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="force-delete"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={forceDelete}
              onChange={(e) => setForceDelete(e.target.checked)}
            />
            <label htmlFor="force-delete" className="ml-2 text-sm text-gray-700 cursor-pointer">
              强制删除（将解除所有关联）
            </label>
          </div>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          variant="error"
          onClick={handleDeleteCategory}
          isLoading={isSubmitting}
          disabled={!canDelete()}
        >
          确认删除
        </Button>
      </ModalFooter>
    </Modal>
  )
}
