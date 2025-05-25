import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState, useEffect } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useSystemStore, SystemLogLevel } from '@/stores/systemStore'

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>日志筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日志级别
              </label>
              <Select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
              >
                <option value="">全部级别</option>
                <option value="INFO">信息</option>
                <option value="WARNING">警告</option>
                <option value="ERROR">错误</option>
                <option value="CRITICAL">严重错误</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模块
              </label>
              <Input
                type="text"
                value={filters.module}
                onChange={(e) => handleFilterChange('module', e.target.value)}
                placeholder="输入模块名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                操作类型
              </label>
              <Input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                placeholder="输入操作类型"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button onClick={handleApplyFilters}>应用筛选</Button>
              <Button variant="outline" onClick={handleResetFilters}>重置</Button>
            </div>

            <Button
              variant="destructive"
              onClick={() => setShowClearModal(true)}
            >
              清除日志
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>日志列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="text-center py-8">
              <p>加载中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">级别</th>
                      <th className="px-6 py-3">模块</th>
                      <th className="px-6 py-3">操作</th>
                      <th className="px-6 py-3">消息</th>
                      <th className="px-6 py-3">时间</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          没有找到日志记录
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="bg-white border-b">
                          <td className="px-6 py-4">{log.id}</td>
                          <td className="px-6 py-4">
                            <Badge variant={getLevelBadgeVariant(log.level)}>
                              {log.level}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">{log.module}</td>
                          <td className="px-6 py-4">{log.action}</td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            {log.message}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(log)}
                            >
                              详情
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {logsPagination.total > 0 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={logsPagination.page}
                    totalPages={logsPagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 清除日志确认弹窗 */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="确认清除日志"
      >
        <div className="p-6">
          <p className="mb-4">确定要清除符合当前筛选条件的日志吗？此操作不可撤销。</p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearLogs}>
              确认清除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 日志详情弹窗 */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="日志详情"
      >
        {selectedLog && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID</p>
                <p>{selectedLog.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">级别</p>
                <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                  {selectedLog.level}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">模块</p>
                <p>{selectedLog.module}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">操作</p>
                <p>{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">时间</p>
                <p>{formatDate(selectedLog.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">用户ID</p>
                <p>{selectedLog.userId || '无'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">IP地址</p>
                <p>{selectedLog.ipAddress || '无'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">用户代理</p>
                <p className="truncate">{selectedLog.userAgent || '无'}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">消息</p>
              <p className="mt-1 p-2 bg-gray-50 rounded">{selectedLog.message}</p>
            </div>

            {selectedLog.details && (
              <div>
                <p className="text-sm font-medium text-gray-500">详细信息</p>
                <pre className="mt-1 p-2 bg-gray-50 rounded overflow-auto max-h-40">
                  {selectedLog.details}
                </pre>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowDetailsModal(false)}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
