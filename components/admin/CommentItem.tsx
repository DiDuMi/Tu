import { ClientOnlyTime } from '@/components/ui/ClientOnlyTime'

interface Comment {
  id: number
  uuid: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isAnonymous: boolean
  nickname?: string
  email?: string
  guestId?: string
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
  user?: {
    id: number
    name: string
    email: string
    image?: string
    isAdmin: boolean
  }
  page: {
    id: number
    uuid: string
    title: string
  }
  reviewer?: {
    id: number
    name: string
  }
}

interface CommentItemProps {
  comment: Comment
  isSelected: boolean
  isQuality: boolean
  onSelect: (commentId: number) => void
  onToggleQuality: (commentId: number) => void
}

export default function CommentItem({
  comment,
  isSelected,
  isQuality,
  onSelect,
  onToggleQuality
}: CommentItemProps) {
  return (
    <div className="p-4">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(comment.id)}
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {comment.user?.name || comment.nickname || '匿名用户'}
              </p>
              {comment.isAnonymous && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  游客
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                comment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                comment.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {comment.status === 'PENDING' ? '待审核' :
                 comment.status === 'APPROVED' ? '已通过' : '已拒绝'}
              </span>
            </div>
            {comment.status === 'PENDING' && (
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={isQuality}
                    onChange={() => onToggleQuality(comment.id)}
                    className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-600">优质</span>
                </label>
              </div>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {comment.content}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span>内容：{comment.page.title}</span>
            <span className="mx-2">•</span>
            <ClientOnlyTime dateString={comment.createdAt} />
            {comment.reviewedAt && (
              <>
                <span className="mx-2">•</span>
                <span>审核时间：<ClientOnlyTime dateString={comment.reviewedAt} /></span>
              </>
            )}
            {comment.reviewer && (
              <>
                <span className="mx-2">•</span>
                <span>审核人：{comment.reviewer.name}</span>
              </>
            )}
          </div>
          {comment.reviewNote && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
              审核备注：{comment.reviewNote}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
