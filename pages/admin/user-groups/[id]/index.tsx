import { GetServerSideProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { useFetch, useMutation } from '@/hooks/useFetch'
import { formatDate } from '@/lib/date'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { UserGroup, User } from '@/stores/adminUserStore'
import { PaginatedResponse } from '@/types/api'

export default function UserGroupDetail() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [_currentPage, _setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // 获取用户组详情
  const { data: groupData, error: groupError, isLoading: groupLoading, mutate: _mutate } = useFetch<UserGroup>(
    mounted && id ? `/api/v1/user-groups/${id}` : null
  )

  // 获取用户组成员
  const { data: membersData, error: membersError, isLoading: membersLoading } = useFetch<PaginatedResponse<User>>(
    mounted && id ? `/api/v1/users?userGroupId=${id}&page=${_currentPage}&limit=${pageSize}` : null
  )

  // 删除用户组的API调用
  const { delete: deleteUserGroup, loading: deleteLoading } = useMutation(`/api/v1/user-groups/${id}`)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 处理删除用户组
  const handleDeleteUserGroup = async () => {
    try {
      const result = await deleteUserGroup()
      if (result.success) {
        // 删除成功，跳转到用户组列表页
        router.push('/admin/user-groups')
      }
    } catch (error) {
      console.error('删除用户组失败:', error)
    }
  }

  if (!mounted) return null

  if (groupLoading) {
    return (
      <AdminLayout title="用户组详情 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (groupError || !groupData?.success) {
    return (
      <AdminLayout title="用户组详情 - 兔图管理后台">
        <Alert variant="error">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {(groupError instanceof Error ? groupError.message : groupError) || '无法加载用户组信息，请稍后重试'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/user-groups">
            <Button>返回用户组列表</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const group = groupData.data
  const members = (membersData as any)?.data?.items || []
  const _totalMembers = (membersData as any)?.data?.pagination?.total || 0

  return (
    <AdminLayout title={`用户组详情: ${group.name} - 兔图管理后台`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户组详情</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和管理用户组信息
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link href={`/admin/user-groups/${id}/edit`}>
            <Button variant="secondary">
              编辑用户组
            </Button>
          </Link>
          <Button
            variant="error"
            onClick={() => setDeleteModalOpen(true)}
            disabled={!!(group.userCount && group.userCount > 0)}
            title={group.userCount && group.userCount > 0 ? '该用户组下有用户，无法删除' : ''}
          >
            删除用户组
          </Button>
          <Link href="/admin/user-groups">
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
              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">用户组ID</dt>
                  <dd className="text-sm text-gray-900">{group.id}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">UUID</dt>
                  <dd className="text-sm text-gray-900 truncate max-w-[150px]" title={group.uuid}>
                    {group.uuid}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">名称</dt>
                  <dd className="text-sm text-gray-900">{group.name}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">用户数量</dt>
                  <dd className="text-sm text-gray-900">{group.userCount || 0}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">预览百分比</dt>
                  <dd className="text-sm text-gray-900">{group.previewPercentage}%</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                  <dd className="text-sm text-gray-900">{formatDate(group.createdAt)}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                  <dd className="text-sm text-gray-900">{formatDate(group.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {group.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{group.description}</p>
              </CardContent>
            </Card>
          )}

          {group.uploadLimits && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>上传限制</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-gray-200">
                  {group.uploadLimits.maxFileSize && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">最大文件大小</dt>
                      <dd className="text-sm text-gray-900">
                        {Math.round(group.uploadLimits.maxFileSize / (1024 * 1024))} MB
                      </dd>
                    </div>
                  )}
                  {group.uploadLimits.allowedTypes && group.uploadLimits.allowedTypes.length > 0 && (
                    <div className="py-3">
                      <dt className="text-sm font-medium text-gray-500 mb-2">允许的文件类型</dt>
                      <dd className="text-sm text-gray-900">
                        <div className="flex flex-wrap gap-2">
                          {group.uploadLimits.allowedTypes.map((type) => (
                            <Badge key={type} variant="secondary">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>权限配置</CardTitle>
            </CardHeader>
            <CardContent>
              {group.permissions && Object.keys(group.permissions).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(group.permissions).map(([resource, actions]) => (
                    <div key={resource} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                        {resource} 权限
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => (
                          <Badge key={action} variant="secondary" className="capitalize">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">该用户组暂无权限配置</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>用户组成员</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : membersError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-error-500">
                        {membersError instanceof Error ? membersError.message : membersError}
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        该用户组暂无成员
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 mr-3 relative">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name}
                                  fill
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'ADMIN' ? 'error' :
                            user.role === 'OPERATOR' ? 'warning' :
                            user.role === 'ANNUAL_MEMBER' ? 'secondary' :
                            user.role === 'MEMBER' ? 'primary' :
                            'default'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.status === 'ACTIVE' ? 'success' :
                            user.status === 'PENDING' ? 'warning' :
                            'error'
                          }>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              查看
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
            确定要删除用户组 <strong>{group.name}</strong> 吗？此操作不可撤销。
          </p>
          {group.userCount && group.userCount > 0 && (
            <p className="mt-2 text-error-500">
              该用户组下有 {group.userCount} 个用户，请先将这些用户移动到其他用户组。
            </p>
          )}
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
            onClick={handleDeleteUserGroup}
            isLoading={deleteLoading}
            disabled={!!(group.userCount && group.userCount > 0)}
          >
            确认删除
          </Button>
        </ModalFooter>
      </Modal>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/user-groups',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
