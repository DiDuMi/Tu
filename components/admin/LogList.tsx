import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { SystemLogLevel } from '@/stores/systemStore'

interface Log {
  id: number
  level: SystemLogLevel
  module: string
  action: string
  message: string
  createdAt: string
}

interface LogPagination {
  page: number
  totalPages: number
  total: number
}

interface LogListProps {
  logs: Log[]
  isLoading: boolean
  pagination: LogPagination
  onViewDetails: (log: Log) => void
  onPageChange: (page: number) => void
}

// 获取日志级别样式
const getLevelBadgeVariant = (level: SystemLogLevel) => {
  switch (level) {
    case 'INFO':
      return 'default'
    case 'WARNING':
      return 'warning'
    case 'ERROR':
      return 'destructive'
    case 'CRITICAL':
      return 'destructive'
    default:
      return 'default'
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

export default function LogList({
  logs,
  isLoading,
  pagination,
  onViewDetails,
  onPageChange
}: LogListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>日志列表</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p>加载中...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">级别</th>
                    <th className="px-6 py-3">模块</th>
                    <th className="px-6 py-3">操作</th>
                    <th className="px-6 py-3">消息</th>
                    <th className="px-6 py-3">时间</th>
                    <th className="px-6 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        没有找到日志记录
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="bg-white border-b">
                        <td className="px-6 py-4">{log.id}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{log.module}</td>
                        <td className="px-6 py-4">{log.action}</td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {log.message}
                        </td>
                        <td className="px-6 py-4">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails(log)}
                          >
                            详情
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total > 0 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
