import { Button } from '@/components/ui/Button'

interface CommentBatchActionsProps {
  selectedCount: number
  qualityCount: number
  reviewNote: string
  isSubmitting: boolean
  onReviewNoteChange: (note: string) => void
  onBatchApprove: () => void
  onBatchReject: () => void
}

export default function CommentBatchActions({
  selectedCount,
  qualityCount,
  reviewNote,
  isSubmitting,
  onReviewNoteChange,
  onBatchApprove,
  onBatchReject
}: CommentBatchActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-900">
            已选择 {selectedCount} 条评论
          </p>
          <p className="text-xs text-blue-700">
            其中 {qualityCount} 条标记为优质评论
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchApprove}
            disabled={isSubmitting}
          >
            批量通过
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onBatchReject}
            disabled={isSubmitting}
          >
            批量拒绝
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="reviewNote" className="block text-sm font-medium text-blue-900 mb-1">
          审核备注（可选）
        </label>
        <input
          type="text"
          id="reviewNote"
          value={reviewNote}
          onChange={(e) => onReviewNoteChange(e.target.value)}
          placeholder="输入审核备注..."
          className="block w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
