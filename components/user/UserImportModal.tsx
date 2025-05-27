import { useState, useRef } from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

interface UserImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => Promise<void>
  isLoading: boolean
}

export default function UserImportModal({
  isOpen,
  onClose,
  onImport,
  isLoading
}: UserImportModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
    }
  }

  // 处理导入
  const handleImport = async () => {
    if (!importFile) return

    try {
      await onImport(importFile)
      // 重置状态
      setImportFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('导入失败:', error)
    }
  }

  // 处理关闭
  const handleClose = () => {
    setImportFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="导入用户数据"
    >
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择CSV或Excel文件
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
          </div>
          <Alert variant="warning">
            <p className="font-medium">导入说明：</p>
            <ul className="list-disc list-inside text-sm mt-1">
              <li>文件必须是CSV或Excel格式</li>
              <li>第一行必须是标题行，包含字段名</li>
              <li>必须包含name和email字段</li>
              <li>如果导入新用户，系统将自动生成随机密码并发送邮件</li>
              <li>如果导入已存在的用户（通过email匹配），将更新用户信息</li>
            </ul>
          </Alert>
          <Alert variant="info">
            <a href="/templates/user_import_template.csv" download className="text-primary-600 underline">
              下载导入模板
            </a>
          </Alert>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          isLoading={isLoading}
          disabled={!importFile}
        >
          开始导入
        </Button>
      </ModalFooter>
    </Modal>
  )
}
