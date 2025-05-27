import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SystemLogLevel } from '@/stores/systemStore'

interface Log {
  id: number
  level: SystemLogLevel
  module: string
  action: string
  message: string
  createdAt: string
  userId?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  details?: string | null
}

interface LogDetailModalProps {
  isOpen: boolean
  log: Log | null
  onClose: () => void
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

export default function LogDetailModal({
  isOpen,
  log,
  onClose
}: LogDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="日志详情"
    >
      {log && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">ID</p>
              <p>{log.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">级别</p>
              <Badge variant={getLevelBadgeVariant(log.level)}>
                {log.level}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">模块</p>
              <p>{log.module}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">操作</p>
              <p>{log.action}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">时间</p>
              <p>{formatDate(log.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">用户ID</p>
              <p>{log.userId || '无'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">IP地址</p>
              <p>{log.ipAddress || '无'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">用户代理</p>
              <p className="truncate">{log.userAgent || '无'}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">消息</p>
            <p className="mt-1 p-2 bg-gray-50 rounded">{log.message}</p>
          </div>

          {log.details && (
            <div>
              <p className="text-sm font-medium text-gray-500">详细信息</p>
              <pre className="mt-1 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                {log.details}
              </pre>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
