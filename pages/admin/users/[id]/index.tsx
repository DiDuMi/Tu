import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatDateTime } from '@/lib/date'
import { isAdmin, isOperator } from '@/lib/permissions'
import { useFetch } from '@/hooks/useFetch'
import { useMutation } from '@/hooks/useFetch'
import { User } from '@/stores/adminUserStore'

export default function UserDetail() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveReason, setApproveReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

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
  const handleApproveUser = async () => {
    try {
      const result = await approveUser({
        action: 'approve',
        reason: approveReason || undefined,
      })
      if (result.success) {
        // 刷新用户数据
        mutate()
        setApproveModalOpen(false)
        setApproveReason('')
      }
    } catch (error) {
      console.error('批准用户失败:', error)
    }
  }

  // 处理拒绝用户
  const handleRejectUser = async () => {
    try {
      const result = await approveUser({
        action: 'reject',
        reason: rejectReason || undefined,
      })
      if (result.success) {
        // 刷新用户数据
        mutate()
        setRejectModalOpen(false)
        setRejectReason('')
      }
    } catch (error) {
      console.error('拒绝用户失败:', error)
    }
  }

  // 获取用户状态徽章
  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">活跃</Badge>
      case 'PENDING':
        return <Badge variant="warning">待审核</Badge>
      case 'REJECTED':
        return <Badge variant="error">已拒绝</Badge>
      case 'SUSPENDED':
        return <Badge variant="error">已禁用</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // 获取用户角色徽章
  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="error">管理员</Badge>
      case 'OPERATOR':
        return <Badge variant="warning">操作员</Badge>
      case 'ANNUAL_MEMBER':
        return <Badge variant="secondary">年度会员</Badge>
      case 'MEMBER':
        return <Badge variant="primary">会员</Badge>
      case 'REGISTERED':
        return <Badge variant="default">注册用户</Badge>
      case 'GUEST':
        return <Badge variant="outline">访客</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

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
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-gray-200 flex-shrink-0 mb-4">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="h-24 w-24 rounded-full"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-2 flex space-x-2">
                  {getUserRoleBadge(user.role)}
                  {getUserStatusBadge(user.status)}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">用户ID</dt>
                    <dd className="text-sm text-gray-900">{user.id}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">UUID</dt>
                    <dd className="text-sm text-gray-900 truncate max-w-[150px]" title={user.uuid}>
                      {user.uuid}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">用户组</dt>
                    <dd className="text-sm text-gray-900">
                      {user.userGroup?.name || '无'}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(user.createdAt)}
                    </dd>
                  </div>
                  {(user as any).telegramUsername && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Telegram 用户名</dt>
                      <dd className="text-sm text-gray-900">
                        @{(user as any).telegramUsername}
                      </dd>
                    </div>
                  )}
                  {(user as any).telegramId && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Telegram ID</dt>
                      <dd className="text-sm text-gray-900">
                        {(user as any).telegramId}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>用户积分</CardTitle>
            </CardHeader>
            <CardContent>
              {user.userPoint ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">当前积分</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {user.userPoint.balance}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">累计获得</p>
                    <p className="text-2xl font-bold text-success-600">
                      {user.userPoint.totalEarned}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">累计消费</p>
                    <p className="text-2xl font-bold text-warning-600">
                      {user.userPoint.totalSpent}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">该用户暂无积分记录</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>权限信息</CardTitle>
            </CardHeader>
            <CardContent>
              {user.userGroup?.permissions ? (
                <div className="space-y-4">
                  {Object.entries(user.userGroup.permissions).map(([resource, actions]) => (
                    <div key={resource} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                        {resource} 权限
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(actions) ? actions.map((action) => (
                          <Badge key={action} variant="secondary" className="capitalize">
                            {action}
                          </Badge>
                        )) : (
                          <Badge variant="secondary">
                            {String(actions)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">该用户暂无特定权限配置</p>
              )}
            </CardContent>
          </Card>

          {/* 申请原因卡片 */}
          {(user as any).applicationReason && (
            <Card>
              <CardHeader>
                <CardTitle>申请原因</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {(user as any).applicationReason}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  用户在注册时提供的申请原因，可作为审核参考
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 删除确认模态框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
      >
        <ModalBody>
          <p>
            确定要删除用户 <strong>{user.name}</strong> 吗？此操作不可撤销。
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteLoading}
          >
            取消
          </Button>
          <Button
            variant="error"
            onClick={handleDeleteUser}
            isLoading={deleteLoading}
          >
            确认删除
          </Button>
        </ModalFooter>
      </Modal>

      {/* 批准申请模态框 */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="批准用户申请"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>
              确定要批准用户 <strong>{user.name}</strong> 的申请吗？
            </p>
            {(user as any).applicationReason && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">申请原因：</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {(user as any).applicationReason}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="approveReason" className="block text-sm font-medium text-gray-700 mb-1">
                批准备注（可选）
              </label>
              <textarea
                id="approveReason"
                rows={3}
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="可以添加批准的备注信息..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                maxLength={500}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setApproveModalOpen(false)}
            disabled={approveLoading}
          >
            取消
          </Button>
          <Button
            variant="success"
            onClick={handleApproveUser}
            isLoading={approveLoading}
          >
            确认批准
          </Button>
        </ModalFooter>
      </Modal>

      {/* 拒绝申请模态框 */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="拒绝用户申请"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>
              确定要拒绝用户 <strong>{user.name}</strong> 的申请吗？
            </p>
            {(user as any).applicationReason && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">申请原因：</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {(user as any).applicationReason}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-1">
                拒绝原因（建议填写）
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请说明拒绝的原因，这将有助于用户了解拒绝的原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                maxLength={500}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setRejectModalOpen(false)}
            disabled={approveLoading}
          >
            取消
          </Button>
          <Button
            variant="error"
            onClick={handleRejectUser}
            isLoading={approveLoading}
          >
            确认拒绝
          </Button>
        </ModalFooter>
      </Modal>
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
