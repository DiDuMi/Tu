import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from 'sonner'
import { ContentStatus } from '@/lib/content-workflow'

interface ContentStatusActionsProps {
  contentId: number
  currentStatus: ContentStatus
  onStatusChange: () => void
}

export default function ContentStatusActions({
  contentId,
  currentStatus,
  onStatusChange,
}: ContentStatusActionsProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [targetStatus, setTargetStatus] = useState<ContentStatus | null>(null)
  const [feedback, setFeedback] = useState('')

  // 根据当前状态和用户角色确定可用的操作
  const getAvailableActions = () => {
    if (!session) return []

    const userRole = session.user.role
    const actions = []

    // 根据当前状态和用户角色确定可用的操作
    switch (currentStatus) {
      case 'DRAFT':
        if (['AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
          actions.push({
            status: 'PENDING_REVIEW' as ContentStatus,
            label: '提交审核',
            color: 'primary',
          })
        }
        if (['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
          actions.push({
            status: 'PUBLISHED' as ContentStatus,
            label: '直接发布',
            color: 'success',
          })
        }
        actions.push({
          status: 'ARCHIVED' as ContentStatus,
          label: '归档',
          color: 'secondary',
        })
        break

      case 'PENDING_REVIEW':
        if (['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
          actions.push({
            status: 'PUBLISHED' as ContentStatus,
            label: '通过并发布',
            color: 'success',
          })
          actions.push({
            status: 'REJECTED' as ContentStatus,
            label: '拒绝',
            color: 'error',
          })
        }
        actions.push({
          status: 'DRAFT' as ContentStatus,
          label: '退回草稿',
          color: 'secondary',
        })
        break

      case 'PUBLISHED':
        actions.push({
          status: 'ARCHIVED' as ContentStatus,
          label: '归档',
          color: 'secondary',
        })
        actions.push({
          status: 'DRAFT' as ContentStatus,
          label: '退回草稿',
          color: 'secondary',
        })
        break

      case 'REJECTED':
        actions.push({
          status: 'DRAFT' as ContentStatus,
          label: '退回草稿',
          color: 'secondary',
        })
        break

      case 'ARCHIVED':
        actions.push({
          status: 'DRAFT' as ContentStatus,
          label: '恢复为草稿',
          color: 'secondary',
        })
        if (['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
          actions.push({
            status: 'PUBLISHED' as ContentStatus,
            label: '重新发布',
            color: 'success',
          })
        }
        break
    }

    return actions
  }

  // 处理状态变更
  const handleStatusChange = async (status: ContentStatus) => {
    // 如果是需要反馈的状态变更，显示模态框
    if (status === 'REJECTED' || (currentStatus === 'PENDING_REVIEW' && status === 'PUBLISHED')) {
      setTargetStatus(status)
      setShowModal(true)
      return
    }

    // 直接执行状态变更
    await updateContentStatus(status)
  }

  // 提交状态变更
  const handleSubmit = async () => {
    if (!targetStatus) return

    await updateContentStatus(targetStatus)
    setShowModal(false)
    setTargetStatus(null)
    setFeedback('')
  }

  // 更新内容状态
  const updateContentStatus = async (status: ContentStatus) => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/v1/content/${contentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          feedback: feedback || undefined,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || '状态更新失败')
      }

      toast.success(result.message || '状态已更新')
      onStatusChange()
    } catch (error) {
      console.error('状态更新失败:', error)
      toast.error(error instanceof Error ? error.message : '状态更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 获取状态标签
  const getStatusLabel = (status: ContentStatus) => {
    switch (status) {
      case 'DRAFT':
        return '草稿'
      case 'PENDING_REVIEW':
        return '待审核'
      case 'PUBLISHED':
        return '已发布'
      case 'REJECTED':
        return '已拒绝'
      case 'ARCHIVED':
        return '已归档'
      default:
        return status
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-200 text-gray-800'
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'ARCHIVED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const actions = getAvailableActions()

  return (
    <div>
      <div className="flex items-center mb-4">
        <span className="mr-2">当前状态:</span>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(currentStatus)}`}>
          {getStatusLabel(currentStatus)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            variant={action.color as any}
            size="sm"
            onClick={() => handleStatusChange(action.status)}
            disabled={isLoading}
          >
            {action.label}
          </Button>
        ))}
      </div>

      {/* 状态变更反馈模态框 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${targetStatus === 'REJECTED' ? '拒绝' : '审核通过'}内容`}
      >
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {targetStatus === 'REJECTED' ? '拒绝原因' : '审核反馈'}
              {targetStatus === 'REJECTED' && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={targetStatus === 'REJECTED' ? '请输入拒绝原因...' : '请输入审核反馈...'}
              rows={4}
              required={targetStatus === 'REJECTED'}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isLoading}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (targetStatus === 'REJECTED' && !feedback.trim())}
            >
              {isLoading ? '处理中...' : '确认'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
