import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface LogExportActionsProps {
  showClearModal: boolean
  onCloseClearModal: () => void
  onConfirmClear: () => Promise<void>
}

export default function LogExportActions({
  showClearModal,
  onCloseClearModal,
  onConfirmClear
}: LogExportActionsProps) {
  const handleConfirmClear = async () => {
    try {
      await onConfirmClear()
    } catch (error) {
      console.error('清除日志失败:', error)
    }
  }

  return (
    <Modal
      isOpen={showClearModal}
      onClose={onCloseClearModal}
      title="确认清除日志"
    >
      <div className="p-6">
        <p className="mb-4">确定要清除符合当前筛选条件的日志吗？此操作不可撤销。</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCloseClearModal}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirmClear}>
            确认清除
          </Button>
        </div>
      </div>
    </Modal>
  )
}
