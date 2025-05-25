import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Tag } from '@/stores/contentStore'

interface DeleteTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tag: Tag | null
}

/**
 * 删除标签确认模态框组件
 * 用于确认删除标签
 */
export default function DeleteTagModal({ isOpen, onClose, onSuccess, tag }: DeleteTagModalProps) {
  // 状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // API调用
  const { delete: deleteTag, loading: deleteLoading } = useMutation<{ uuid: string }>('/api/v1/tags')
  
  // 处理删除标签
  const handleDeleteTag = async () => {
    if (!tag) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await deleteTag(tag.uuid)
      if (result.success) {
        // 关闭模态框
        onClose()
        
        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '删除标签失败')
      }
    } catch (error) {
      console.error('删除标签失败:', error)
      setError((error as Error).message || '删除标签失败')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认删除"
    >
      <ModalBody>
        <p>
          确定要删除标签 <strong>{tag?.name}</strong> 吗？此操作不可撤销。
        </p>
        {(tag?.useCount || 0) > 0 && (
          <Alert variant="warning" className="mt-4">
            此标签已被使用 {tag?.useCount} 次，删除后将解除与内容的关联。
          </Alert>
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
          onClick={handleDeleteTag}
          isLoading={isSubmitting}
        >
          确认删除
        </Button>
      </ModalFooter>
    </Modal>
  )
}
