import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useMutation } from '@/hooks/useFetch'


import UserExportModal from './UserExportModal'
import UserImportModal from './UserImportModal'
import UserImportProgress from './UserImportProgress'

interface UserImportExportProps {
  onActionComplete: () => void
}

export default function UserImportExport({ onActionComplete }: UserImportExportProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importProgressModalOpen, setImportProgressModalOpen] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    total: number
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // API调用
  const { loading: importLoading } = useMutation('/api/v1/users/import')

  // 导出和文件选择逻辑已移至组件中

  // 处理导入
  const handleImport = async (file: File) => {
    try {
      // 创建FormData对象
      const formData = new FormData()
      formData.append('file', file)

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
    setImportProgress(0)
    setImportResult(null)
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

      <UserExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      <UserImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        isLoading={importLoading}
      />

      <UserImportProgress
        isOpen={importProgressModalOpen}
        progress={importProgress}
        result={importResult}
        onClose={handleCloseImportResult}
      />
    </div>
  )
}
