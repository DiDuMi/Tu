import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Page } from '@/stores/contentStore'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  page: Page | null
}

/**
 * 内容审核模态框组件
 * 用于提交内容审核意见
 */
export default function ReviewModal({
  isOpen,
  onClose,
  onSuccess,
  page
}: ReviewModalProps) {
  // 表单状态
  const [reviewStatus, setReviewStatus] = useState('APPROVED')
  const [reviewContent, setReviewContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API调用
  const { post: submitReview, loading: submitLoading } = useMutation<{ uuid: string }>('/api/v1/content')

  // 处理提交审核
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!page || !reviewContent) {
      setError('请填写审核意见')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 使用fetch直接调用API，因为useMutation不支持动态URL
      const response = await fetch(`/api/v1/content/${page.uuid}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: reviewContent,
          status: reviewStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 重置表单
        resetForm()

        // 关闭模态框
        onClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '提交审核失败')
      }
    } catch (error) {
      console.error('提交审核失败:', error)
      setError((error as Error).message || '提交审核失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 重置表单
  const resetForm = () => {
    setReviewStatus('APPROVED')
    setReviewContent('')
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
      title="内容审核"
    >
      <form onSubmit={handleSubmitReview}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容标题
              </label>
              <div className="p-2 bg-gray-50 rounded-md">
                {page?.title}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                审核结果 <span className="text-error-500">*</span>
              </label>
              <Select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                options={[
                  { value: 'APPROVED', label: '通过' },
                  { value: 'REJECTED', label: '拒绝' },
                  { value: 'NEEDS_CHANGES', label: '需要修改' },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                审核意见 <span className="text-error-500">*</span>
              </label>
              <Textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="请输入审核意见..."
                rows={5}
                required
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
            disabled={!reviewContent}
          >
            提交审核
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
