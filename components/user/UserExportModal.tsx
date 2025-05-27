import { useState } from 'react'

import { useMutation } from '@/hooks/useFetch'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

interface UserExportModalProps {
  isOpen: boolean
  onClose: () => void
}

// 导出字段选项
const exportFields = [
  { id: 'id', label: 'ID' },
  { id: 'uuid', label: 'UUID' },
  { id: 'name', label: '用户名' },
  { id: 'email', label: '邮箱' },
  { id: 'role', label: '角色' },
  { id: 'status', label: '状态' },
  { id: 'userGroup', label: '用户组' },
  { id: 'createdAt', label: '注册时间' },
  { id: 'updatedAt', label: '更新时间' },
]

export default function UserExportModal({ isOpen, onClose }: UserExportModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id', 'name', 'email', 'role', 'status', 'createdAt'
  ])

  // API调用
  const { post: exportUsers, loading: exportLoading } = useMutation('/api/v1/users/export')

  // 处理字段选择变化
  const handleFieldChange = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  // 处理导出
  const handleExport = async () => {
    if (selectedFields.length === 0) return

    try {
      const result = await exportUsers({
        fields: selectedFields,
        format: 'csv'
      })

      if (result.success && result.data.downloadUrl) {
        // 创建一个临时链接并点击它来下载文件
        const link = document.createElement('a')
        link.href = result.data.downloadUrl
        link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        onClose()
      }
    } catch (error) {
      console.error('导出用户失败:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导出用户数据"
    >
      <ModalBody>
        <div className="space-y-4">
          <p>请选择要导出的字段：</p>
          <div className="grid grid-cols-2 gap-2">
            {exportFields.map(field => (
              <div key={field.id} className="flex items-center">
                <Checkbox
                  id={`field-${field.id}`}
                  checked={selectedFields.includes(field.id)}
                  onChange={() => handleFieldChange(field.id)}
                />
                <label
                  htmlFor={`field-${field.id}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {field.label}
                </label>
              </div>
            ))}
          </div>
          <Alert variant="info">
            导出的数据将以CSV格式下载，可以使用Excel或其他电子表格软件打开。
          </Alert>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={exportLoading}
        >
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          isLoading={exportLoading}
          disabled={selectedFields.length === 0}
        >
          导出
        </Button>
      </ModalFooter>
    </Modal>
  )
}
