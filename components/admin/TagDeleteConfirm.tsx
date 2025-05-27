import { Button } from '@/components/ui/Button'

interface MediaTag {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

interface TagDeleteConfirmProps {
  tag: MediaTag | null
  onConfirm: () => void
  onCancel: () => void
}

export default function TagDeleteConfirm({
  tag,
  onConfirm,
  onCancel
}: TagDeleteConfirmProps) {
  if (!tag) return null

  return (
    <div className="space-y-4">
      <p>确定要删除标签 &ldquo;{tag.name}&rdquo; 吗？</p>
      <p className="text-sm text-red-500">
        注意：如果该标签已被媒体文件使用，将无法删除。
      </p>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          删除
        </Button>
      </div>
    </div>
  )
}
