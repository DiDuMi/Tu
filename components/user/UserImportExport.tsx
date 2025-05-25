import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { useMutation } from '@/hooks/useFetch'

interface UserImportExportProps {
  onActionComplete: () => void
}

export default function UserImportExport({ onActionComplete }: UserImportExportProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importProgressModalOpen, setImportProgressModalOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>(['id', 'name', 'email', 'role', 'status', 'createdAt'])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    total: number
    success: number
    failed: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API调用
  const { post: exportUsers, loading: exportLoading } = useMutation('/api/v1/users/export')
  const { post: importUsers, loading: importLoading } = useMutation('/api/v1/users/import')

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

        setExportModalOpen(false)
      }
    } catch (error) {
      console.error('导出用户失败:', error)
    }
  }

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
      // 创建FormData对象
      const formData = new FormData()
      formData.append('file', importFile)

      // 开始显示进度
      setImportModalOpen(false)
      setImportProgressModalOpen(true)
      setImportProgress(0)

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + Math.random() * 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      // 发送请求
      const result = await fetch('/api/v1/users/import', {
        method: 'POST',
        body: formData,
      }).then(res => res.json())

      // 清除进度更新
      clearInterval(progressInterval)

      if (result.success) {
        setImportProgress(100)
        setImportResult({
          total: result.data.total,
          success: result.data.success,
          failed: result.data.failed,
          errors: result.data.errors || []
        })

        // 导入完成后刷新列表
        onActionComplete()
      } else {
        setImportResult({
          total: 0,
          success: 0,
          failed: 0,
          errors: [result.error?.message || '导入失败']
        })
      }
    } catch (error) {
      console.error('导入用户失败:', error)
      setImportProgress(100)
      setImportResult({
        total: 0,
        success: 0,
        failed: 0,
        errors: [(error as Error).message || '导入失败']
      })
    }
  }

  // 关闭导入结果并重置状态
  const handleCloseImportResult = () => {
    setImportProgressModalOpen(false)
    setImportFile(null)
    setImportProgress(0)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex space-x-2 mb-4">
      <Button
        variant="outline"
        onClick={() => setExportModalOpen(true)}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        导出用户
      </Button>
      <Button
        variant="outline"
        onClick={() => setImportModalOpen(true)}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v6m0 0l-3-3m3 3l3-3m-3 9v-6m0 0l-3 3m3-3l3 3"
          />
        </svg>
        导入用户
      </Button>

      {/* 导出模态框 */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
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
            onClick={() => setExportModalOpen(false)}
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

      {/* 导入模态框 */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
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
            onClick={() => setImportModalOpen(false)}
            disabled={importLoading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            isLoading={importLoading}
            disabled={!importFile}
          >
            开始导入
          </Button>
        </ModalFooter>
      </Modal>

      {/* 导入进度模态框 */}
      <Modal
        isOpen={importProgressModalOpen}
        onClose={importResult ? handleCloseImportResult : () => {}}
        title={importResult ? "导入结果" : "导入进度"}
        showCloseButton={!!importResult}
      >
        <ModalBody>
          {!importResult ? (
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <p className="text-center">
                正在导入用户数据，请稍候...{Math.round(importProgress)}%
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">总计</p>
                  <p className="text-xl font-semibold">{importResult.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">成功</p>
                  <p className="text-xl font-semibold text-success-600">{importResult.success}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">失败</p>
                  <p className="text-xl font-semibold text-error-600">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <p className="font-medium text-error-600 mb-2">错误信息：</p>
                  <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg text-sm">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="mb-1">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        {importResult && (
          <ModalFooter>
            <Button
              variant="primary"
              onClick={handleCloseImportResult}
            >
              关闭
            </Button>
          </ModalFooter>
        )}
      </Modal>
    </div>
  )
}
