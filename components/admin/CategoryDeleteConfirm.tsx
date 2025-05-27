import { Button } from '@/components/ui/Button'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  description: string | null
  slug: string
  parentId: number | null
  children?: MediaCategory[]
  createdAt: string
  updatedAt: string
}

interface CategoryDeleteConfirmProps {
  category: MediaCategory | null
  onConfirm: () => void
  onCancel: () => void
}

export default function CategoryDeleteConfirm({
  category,
  onConfirm,
  onCancel
}: CategoryDeleteConfirmProps) {
  if (!category) return null

  return (
    <div className="space-y-4">
      <p>确定要删除分类 &ldquo;{category.name}&rdquo; 吗？</p>
      <p className="text-sm text-red-500">
        注意：如果该分类下有子分类或媒体文件，将无法删除。
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
