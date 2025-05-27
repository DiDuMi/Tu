import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SystemBackupType, SystemBackupStatus } from '@/stores/systemStore'

interface Backup {
  id: number
  filename: string
  type: SystemBackupType
  size: number
  status: SystemBackupStatus
  createdAt: string
  completedAt?: string | null
}

interface BackupListProps {
  backups: Backup[]
  isLoading: boolean
  onRestore: (backup: Backup) => void
  onDelete: (backup: Backup) => void
  onDownload: (backup: Backup) => void
}

// 获取备份类型显示文本
const getBackupTypeText = (type: SystemBackupType) => {
  switch (type) {
    case 'FULL':
      return '完整备份'
    case 'DATABASE':
      return '数据库备份'
    case 'MEDIA':
      return '媒体文件备份'
    case 'SETTINGS':
      return '系统设置备份'
    default:
      return type
  }
}

// 获取备份状态样式
const getStatusBadgeVariant = (status: SystemBackupStatus) => {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'COMPLETED':
      return 'success'
    case 'FAILED':
      return 'destructive'
    default:
      return 'default'
  }
}

// 获取备份状态显示文本
const getStatusText = (status: SystemBackupStatus) => {
  switch (status) {
    case 'PENDING':
      return '进行中'
    case 'COMPLETED':
      return '已完成'
    case 'FAILED':
      return '失败'
    default:
      return status
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function BackupList({
  backups,
  isLoading,
  onRestore,
  onDelete,
  onDownload
}: BackupListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>备份列表</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p>加载中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">文件名</th>
                  <th className="px-6 py-3">类型</th>
                  <th className="px-6 py-3">大小</th>
                  <th className="px-6 py-3">状态</th>
                  <th className="px-6 py-3">创建时间</th>
                  <th className="px-6 py-3">完成时间</th>
                  <th className="px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      没有找到备份记录
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id} className="bg-white border-b">
                      <td className="px-6 py-4">{backup.id}</td>
                      <td className="px-6 py-4">{backup.filename}</td>
                      <td className="px-6 py-4">
                        {getBackupTypeText(backup.type)}
                      </td>
                      <td className="px-6 py-4">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadgeVariant(backup.status)}>
                          {getStatusText(backup.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {backup.completedAt ? formatDate(backup.completedAt) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {backup.status === 'COMPLETED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRestore(backup)}
                              >
                                恢复
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDownload(backup)}
                              >
                                下载
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(backup)}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
