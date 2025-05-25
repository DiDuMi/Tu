import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState, useEffect } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useSystemStore, SystemBackupType, SystemBackupStatus } from '@/stores/systemStore'

export default function BackupsPage() {
  const [mounted, setMounted] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<any>(null)

  // 新备份表单
  const [newBackup, setNewBackup] = useState({
    type: 'FULL' as SystemBackupType,
    notes: '',
  })

  // 从状态管理获取系统备份
  const {
    backups,
    isLoadingBackups,
    backupsError,
    fetchBackups,
    createBackup,
    restoreBackup,
    deleteBackup
  } = useSystemStore()

  // 获取系统备份
  useEffect(() => {
    fetchBackups()
    setMounted(true)
  }, [fetchBackups])

  // 处理创建备份
  const handleCreateBackup = async () => {
    try {
      await createBackup(newBackup.type, newBackup.notes)
      setShowCreateModal(false)
      setNewBackup({
        type: 'FULL',
        notes: '',
      })
    } catch (error) {
      console.error('创建备份失败:', error)
    }
  }

  // 处理恢复备份
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return

    try {
      await restoreBackup(selectedBackup.id)
      setShowRestoreModal(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('恢复备份失败:', error)
    }
  }

  // 处理删除备份
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return

    try {
      await deleteBackup(selectedBackup.id)
      setShowDeleteModal(false)
      setSelectedBackup(null)
    } catch (error) {
      console.error('删除备份失败:', error)
    }
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

  if (!mounted) return null

  return (
    <AdminLayout title="系统备份 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">系统备份</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理系统备份和恢复
        </p>
      </div>

      {backupsError && (
        <Alert variant="destructive" className="mb-4">
          {backupsError}
        </Alert>
      )}

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          创建新备份
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>备份列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBackups ? (
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
                                  onClick={() => {
                                    setSelectedBackup(backup)
                                    setShowRestoreModal(true)
                                  }}
                                >
                                  恢复
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.location.href = `/api/v1/backups/${backup.id}/download`
                                  }}
                                >
                                  下载
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedBackup(backup)
                                setShowDeleteModal(true)
                              }}
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

      {/* 恢复备份确认弹窗 */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="确认恢复备份"
      >
        {selectedBackup && (
          <div className="p-6">
            <p className="mb-4">
              确定要恢复此备份吗？此操作将覆盖当前系统数据，且不可撤销。
            </p>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                备份文件: {selectedBackup.filename}
                <br />
                类型: {getBackupTypeText(selectedBackup.type)}
                <br />
                创建时间: {formatDate(selectedBackup.createdAt)}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleRestoreBackup}>
                确认恢复
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除备份确认弹窗 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="确认删除备份"
      >
        {selectedBackup && (
          <div className="p-6">
            <p className="mb-4">
              确定要删除此备份吗？此操作不可撤销。
            </p>
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-gray-800 text-sm">
                备份文件: {selectedBackup.filename}
                <br />
                类型: {getBackupTypeText(selectedBackup.type)}
                <br />
                创建时间: {formatDate(selectedBackup.createdAt)}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteBackup}>
                确认删除
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

  // 检查用户是否有权限访问系统备份
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/settings/backups',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
