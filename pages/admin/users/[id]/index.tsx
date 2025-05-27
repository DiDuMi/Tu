
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'


import UserActionModals from '@/components/admin/UserActionModals'
import UserApplicationCard from '@/components/admin/UserApplicationCard'
import UserBasicInfo from '@/components/admin/UserBasicInfo'
import UserPermissionsCard from '@/components/admin/UserPermissionsCard'
import UserPointsCard from '@/components/admin/UserPointsCard'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useFetch, useMutation } from '@/hooks/useFetch'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { User } from '@/stores/adminUserStore'

export default function UserDetail() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  // 原因状态已移至UserActionModals组件

  // 获取用户详情
  const { data: userData, error: userError, isLoading: userLoading, mutate } = useFetch<User>(
    mounted && id ? `/api/v1/users/${id}` : null
  )

  // 删除用户的API调用
  const { delete: deleteUser, loading: deleteLoading } = useMutation(`/api/v1/users/${id}`)

  // 审核用户的API调用
  const { post: approveUser, loading: approveLoading } = useMutation(`/api/v1/users/${id}/approve`)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理删除用户
  const handleDeleteUser = async () => {
    try {
      const result = await deleteUser()
      if (result.success) {
        // 删除成功，跳转到用户列表页
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
    }
  }

  // 处理批准用户
  const handleApproveUser = async (reason?: string) => {
    try {
      const result = await approveUser({
        action: 'approve',
        reason: reason || undefined,
      })
      if (result.success) {
        // 刷新用户数据
        mutate()
        setApproveModalOpen(false)
      }
    } catch (error) {
      console.error('批准用户失败:', error)
    }
  }

  // 处理拒绝用户
  const handleRejectUser = async (reason?: string) => {
    try {
      const result = await approveUser({
        action: 'reject',
        reason: reason || undefined,
      })
      if (result.success) {
        // 刷新用户数据
        mutate()
        setRejectModalOpen(false)
      }
    } catch (error) {
      console.error('拒绝用户失败:', error)
    }
  }

  // 徽章函数已移至UserBasicInfo组件

  if (!mounted) return null

  if (userLoading) {
    return (
      <AdminLayout title="用户详情 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (userError || !userData?.success) {
    return (
      <AdminLayout title="用户详情 - 兔图管理后台">
        <Alert variant="error">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {(userError instanceof Error ? userError.message : userError) || '无法加载用户信息，请稍后重试'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/users">
            <Button>返回用户列表</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const user = userData.data

  return (
    <AdminLayout title={`用户详情: ${user.name} - 兔图管理后台`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户详情</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和管理用户信息
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          {/* 审核按钮 - 只有待审核状态才显示 */}
          {user.status === 'PENDING' && (
            <>
              <Button
                variant="success"
                onClick={() => setApproveModalOpen(true)}
                disabled={approveLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                批准申请
              </Button>
              <Button
                variant="error"
                onClick={() => setRejectModalOpen(true)}
                disabled={approveLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                拒绝申请
              </Button>
            </>
          )}

          <Link href={`/admin/users/${id}/edit`}>
            <Button variant="secondary">
              编辑用户
            </Button>
          </Link>
          <Button
            variant="error"
            onClick={() => setDeleteModalOpen(true)}
          >
            删除用户
          </Button>
          <Link href="/admin/users">
            <Button variant="outline">
              返回列表
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <UserBasicInfo user={user} />
        </div>

        <div className="md:col-span-2">
          <UserPointsCard userPoint={user.userPoint} />
          <UserPermissionsCard userGroup={user.userGroup} />
          <UserApplicationCard applicationReason={(user as any).applicationReason} />
        </div>
      </div>

      <UserActionModals
        user={{
          name: user.name,
          applicationReason: (user as any).applicationReason
        }}
        deleteModalOpen={deleteModalOpen}
        approveModalOpen={approveModalOpen}
        rejectModalOpen={rejectModalOpen}
        deleteLoading={deleteLoading}
        approveLoading={approveLoading}
        onDeleteModalClose={() => setDeleteModalOpen(false)}
        onApproveModalClose={() => setApproveModalOpen(false)}
        onRejectModalClose={() => setRejectModalOpen(false)}
        onDeleteUser={handleDeleteUser}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
      />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || (!isOperator(session) && !isAdmin(session))) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/users',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
