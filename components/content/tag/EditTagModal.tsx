import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Tag } from '@/stores/contentStore'

interface EditTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tag: Tag | null
}

/**
 * 编辑标签模态框组件
 * 用于编辑现有标签
 */
export default function EditTagModal({ isOpen, onClose, onSuccess, tag }: EditTagModalProps) {
  // 表单状态
  const [editTagName, setEditTagName] = useState('')
  const [editTagSlug, setEditTagSlug] = useState('')
  const [editTagDescription, setEditTagDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API调用
  const { put: updateTag, loading: updateLoading } = useMutation<{ uuid: string }>('/api/v1/tags')

  // 当标签变化时，更新表单状态
  useEffect(() => {
    if (tag) {
      setEditTagName(tag.name)
      setEditTagSlug(tag.slug)
      setEditTagDescription(tag.description || '')
    }
  }, [tag])

  // 处理编辑标签
  const handleEditTag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editTagName || !tag) {
      setError('标签名称不能为空')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 使用fetch直接调用API，因为useMutation不支持动态URL
      const response = await fetch(`/api/v1/tags/${tag.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editTagName,
          slug: editTagSlug || undefined,
          description: editTagDescription || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 关闭模态框
        onClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '更新标签失败')
      }
    } catch (error) {
      console.error('更新标签失败:', error)
      setError((error as Error).message || '更新标签失败')
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
      title="编辑标签"
    >
      <form onSubmit={handleEditTag}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签名称 <span className="text-error-500">*</span>
              </label>
              <Input
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="输入标签名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                别名（可选）
              </label>
              <Input
                value={editTagSlug}
                onChange={(e) => setEditTagSlug(e.target.value)}
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
                value={editTagDescription}
                onChange={(e) => setEditTagDescription(e.target.value)}
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
            disabled={!editTagName}
          >
            保存
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
