
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'


import UserGroupBasicInfo from '@/components/admin/UserGroupBasicInfo'
import UserGroupDeleteModal from '@/components/admin/UserGroupDeleteModal'
import UserGroupMembers from '@/components/admin/UserGroupMembers'
import UserGroupPermissions from '@/components/admin/UserGroupPermissions'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useFetch, useMutation } from '@/hooks/useFetch'
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
          <UserGroupBasicInfo group={group} />
        </div>

        <div className="md:col-span-2">
          <UserGroupPermissions permissions={group.permissions} />
          <UserGroupMembers
            members={members}
            membersLoading={membersLoading}
            membersError={membersError}
          />
        </div>
      </div>

      <UserGroupDeleteModal
        isOpen={deleteModalOpen}
        group={{
          name: group.name,
          userCount: group.userCount
        }}
        deleteLoading={deleteLoading}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteUserGroup}
      />
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
