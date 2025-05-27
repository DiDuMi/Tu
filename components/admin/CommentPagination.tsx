import { Button } from '@/components/ui/Button'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface CommentPaginationProps {
  pagination: Pagination
  onPageChange: (page: number) => void
}

export default function CommentPagination({ pagination, onPageChange }: CommentPaginationProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        显示第 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
        共 {pagination.total} 条
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
        >
          上一页
        </Button>
        <span className="text-sm text-gray-700">
          第 {pagination.page} / {pagination.totalPages} 页
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
          disabled={pagination.page >= pagination.totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
