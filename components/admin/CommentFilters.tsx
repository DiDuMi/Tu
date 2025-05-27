interface CommentFiltersProps {
  statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | ''
  searchQuery: string
  onStatusChange: (status: 'PENDING' | 'APPROVED' | 'REJECTED' | '') => void
  onSearchChange: (query: string) => void
}

export default function CommentFilters({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange
}: CommentFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            状态筛选
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            搜索评论
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索评论内容、用户名或昵称..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
