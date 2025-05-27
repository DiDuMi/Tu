
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState, useEffect } from 'react'


import BackupActions from '@/components/admin/BackupActions'
import BackupDeleteModal from '@/components/admin/BackupDeleteModal'
import BackupList from '@/components/admin/BackupList'
import RestoreModal from '@/components/admin/RestoreModal'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useSystemStore } from '@/stores/systemStore'

export default function BackupsPage() {
  const [mounted, setMounted] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<any>(null)

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

      <BackupActions onCreateBackup={createBackup} />

      <BackupList
        backups={backups}
        isLoading={isLoadingBackups}
        onRestore={(backup) => {
          setSelectedBackup(backup)
          setShowRestoreModal(true)
        }}
        onDelete={(backup) => {
          setSelectedBackup(backup)
          setShowDeleteModal(true)
        }}
        onDownload={(backup) => {
          window.location.href = `/api/v1/backups/${backup.id}/download`
        }}
      />

      <RestoreModal
        isOpen={showRestoreModal}
        backup={selectedBackup}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestoreBackup}
      />

      <BackupDeleteModal
        isOpen={showDeleteModal}
        backup={selectedBackup}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBackup}
      />
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
