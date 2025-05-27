import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SystemBackupType } from '@/stores/systemStore'

interface Backup {
  id: number
  filename: string
  type: SystemBackupType
  createdAt: string
}

interface BackupDeleteModalProps {
  isOpen: boolean
  backup: Backup | null
  onClose: () => void
  onConfirm: () => Promise<void>
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

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

export default function BackupDeleteModal({
  isOpen,
  backup,
  onClose,
  onConfirm
}: BackupDeleteModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('删除备份失败:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认删除备份"
    >
      {backup && (
        <div className="p-6">
          <p className="mb-4">
            确定要删除此备份吗？此操作不可撤销。
          </p>
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-gray-800 text-sm">
              备份文件: {backup.filename}
              <br />
              类型: {getBackupTypeText(backup.type)}
              <br />
              创建时间: {formatDate(backup.createdAt)}
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              确认删除
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
