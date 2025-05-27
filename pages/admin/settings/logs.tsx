
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState, useEffect } from 'react'


import LogDetailModal from '@/components/admin/LogDetailModal'
import LogExportActions from '@/components/admin/LogExportActions'
import LogFilters from '@/components/admin/LogFilters'
import LogList from '@/components/admin/LogList'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useSystemStore } from '@/stores/systemStore'

export default function LogsPage() {
  const [mounted, setMounted] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  // 筛选条件
  const [filters, setFilters] = useState({
    level: '',
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  })

  // 从状态管理获取系统日志
  const {
    logs,
    isLoadingLogs,
    logsError,
    logsPagination,
    fetchLogs,
    clearLogs
  } = useSystemStore()

  // 获取系统日志
  useEffect(() => {
    fetchLogs()
    setMounted(true)
  }, [fetchLogs])

  // 处理分页
  const handlePageChange = (page: number) => {
    fetchLogs(page, logsPagination.limit, getActiveFilters())
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 应用筛选
  const handleApplyFilters = () => {
    fetchLogs(1, logsPagination.limit, getActiveFilters())
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      level: '',
      module: '',
      action: '',
      startDate: '',
      endDate: '',
    })
    fetchLogs(1, logsPagination.limit)
  }

  // 获取活动筛选条件
  const getActiveFilters = () => {
    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
  }

  // 清除日志
  const handleClearLogs = async () => {
    try {
      await clearLogs(getActiveFilters())
      setShowClearModal(false)
    } catch (error) {
      console.error('清除日志失败:', error)
    }
  }

  // 查看日志详情
  const handleViewDetails = (log: any) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // 格式化和样式函数已移至组件中

  if (!mounted) return null

  return (
    <AdminLayout title="系统日志 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">系统日志</h1>
        <p className="mt-1 text-sm text-gray-500">
          查看和管理系统操作日志
        </p>
      </div>

      {logsError && (
        <Alert variant="destructive" className="mb-4">
          {logsError}
        </Alert>
      )}

      <LogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        onClearLogs={() => setShowClearModal(true)}
      />

      <LogList
        logs={logs}
        isLoading={isLoadingLogs}
        pagination={logsPagination}
        onViewDetails={handleViewDetails}
        onPageChange={handlePageChange}
      />

      <LogExportActions
        showClearModal={showClearModal}
        onCloseClearModal={() => setShowClearModal(false)}
        onConfirmClear={handleClearLogs}
      />

      <LogDetailModal
        isOpen={showDetailsModal}
        log={selectedLog}
        onClose={() => setShowDetailsModal(false)}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问系统日志
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/settings/logs',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
