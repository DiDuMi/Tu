import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'
import { Tag } from '@/stores/contentStore'

interface MergeTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  sourceTag: Tag | null
  allTags: Tag[]
}

/**
 * 合并标签模态框组件
 * 用于将一个标签合并到另一个标签
 */
export default function MergeTagModal({
  isOpen,
  onClose,
  onSuccess,
  sourceTag,
  allTags
}: MergeTagModalProps) {
  // 表单状态
  const [targetTagId, setTargetTagId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API调用
  const { post: mergeTag, loading: mergeLoading } = useMutation<{ uuid: string }>(`/api/v1/tags/${sourceTag?.uuid}`)

  // 处理合并标签
  const handleMergeTag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceTag || !targetTagId) {
      setError('请选择源标签和目标标签')
      return
    }

    if (sourceTag.id === parseInt(targetTagId)) {
      setError('源标签和目标标签不能相同')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await mergeTag({
        targetTagId: parseInt(targetTagId),
      })

      if (result.success) {
        // 关闭模态框
        handleClose()

        // 通知父组件刷新数据
        onSuccess()
      } else {
        setError(result.error?.message || '合并标签失败')
      }
    } catch (error) {
      console.error('合并标签失败:', error)
      setError((error as Error).message || '合并标签失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理关闭模态框
  const handleClose = () => {
    // 重置表单
    setTargetTagId('')
    setError(null)

    // 关闭模态框
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="合并标签"
    >
      <form onSubmit={handleMergeTag}>
        <ModalBody>
          <div className="space-y-4">
            <Alert variant="info">
              合并标签会将源标签的所有内容关联转移到目标标签，并删除源标签。此操作不可撤销。
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                源标签
              </label>
              <Input
                value={sourceTag?.name || ''}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标标签 <span className="text-error-500">*</span>
              </label>
              <Select
                value={targetTagId}
                onChange={(e) => setTargetTagId(e.target.value)}
                options={[
                  { value: '', label: '请选择目标标签' },
                  ...allTags
                    .filter(tag => tag.id !== sourceTag?.id)
                    .map(tag => ({
                      value: tag.id.toString(),
                      label: `${tag.name} (${tag.useCount})`
                    }))
                ]}
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
            disabled={!targetTagId}
          >
            合并
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
