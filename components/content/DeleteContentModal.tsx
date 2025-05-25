import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Page } from '@/stores/contentStore'

interface DeleteContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  page: Page | null
}

/**
 * 删除内容确认模态框组件
 * 用于确认删除内容
 */
export default function DeleteContentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  page 
}: DeleteContentModalProps) {
  // 状态
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // API调用
  const { delete: deletePage, loading: deleteLoading } = useMutation<{ uuid: string }>('/api/v1/pages')
  
  // 处理删除内容
  const handleDeletePage = async () => {
    if (!page) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await deletePage(page.uuid)
      if (result.success) {
        // 关闭模态框
        onClose()
        
        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '删除内容失败')
      }
    } catch (error) {
      console.error('删除内容失败:', error)
      setError((error as Error).message || '删除内容失败')
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
          确定要删除内容 <strong>{page?.title}</strong> 吗？此操作不可撤销。
        </p>
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
          onClick={handleDeletePage}
          isLoading={isSubmitting}
        >
          确认删除
        </Button>
      </ModalFooter>
    </Modal>
  )
}
