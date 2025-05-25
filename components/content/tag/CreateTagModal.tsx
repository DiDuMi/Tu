import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'

interface CreateTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * 创建标签模态框组件
 * 用于创建新的标签
 */
export default function CreateTagModal({ isOpen, onClose, onSuccess }: CreateTagModalProps) {
  // 表单状态
  const [newTagName, setNewTagName] = useState('')
  const [newTagSlug, setNewTagSlug] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // API调用
  const { post: createTag, loading: createLoading } = useMutation('/api/v1/tags')
  
  // 处理创建标签
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTagName) {
      setError('标签名称不能为空')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await createTag({
        name: newTagName,
        slug: newTagSlug || undefined,
        description: newTagDescription || undefined,
      })
      
      if (result.success) {
        // 重置表单
        setNewTagName('')
        setNewTagSlug('')
        setNewTagDescription('')
        
        // 关闭模态框
        onClose()
        
        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '创建标签失败')
      }
    } catch (error) {
      console.error('创建标签失败:', error)
      setError((error as Error).message || '创建标签失败')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理关闭模态框
  const handleClose = () => {
    // 重置表单
    setNewTagName('')
    setNewTagSlug('')
    setNewTagDescription('')
    setError(null)
    
    // 关闭模态框
    onClose()
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="创建标签"
    >
      <form onSubmit={handleCreateTag}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签名称 <span className="text-error-500">*</span>
              </label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入标签名称"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                别名（可选）
              </label>
              <Input
                value={newTagSlug}
                onChange={(e) => setNewTagSlug(e.target.value)}
                placeholder="输入标签别名，用于URL"
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
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder="输入标签描述"
                rows={3}
              />
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
            disabled={!newTagName}
          >
            创建
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
