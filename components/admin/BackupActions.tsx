import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { SystemBackupType } from '@/stores/systemStore'

interface BackupActionsProps {
  onCreateBackup: (type: SystemBackupType, notes: string) => Promise<void>
}

export default function BackupActions({ onCreateBackup }: BackupActionsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBackup, setNewBackup] = useState({
    type: 'FULL' as SystemBackupType,
    notes: '',
  })

  const handleCreateBackup = async () => {
    try {
      await onCreateBackup(newBackup.type, newBackup.notes)
      setShowCreateModal(false)
      setNewBackup({
        type: 'FULL',
        notes: '',
      })
    } catch (error) {
      console.error('创建备份失败:', error)
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          创建新备份
        </Button>
      </div>

      {/* 创建备份弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新备份"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备份类型
            </label>
            <Select
              value={newBackup.type}
              onChange={(e) => setNewBackup(prev => ({ ...prev, type: e.target.value as SystemBackupType }))}
            >
              <option value="FULL">完整备份</option>
              <option value="DATABASE">数据库备份</option>
              <option value="MEDIA">媒体文件备份</option>
              <option value="SETTINGS">系统设置备份</option>
            </Select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <Textarea
              value={newBackup.notes}
              onChange={(e) => setNewBackup(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="输入备份备注信息（可选）"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateBackup}>
              创建备份
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
