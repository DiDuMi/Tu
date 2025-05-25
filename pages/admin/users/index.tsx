import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'

import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import AdvancedUserFilter from '@/components/user/AdvancedUserFilter'
import UserBulkActions from '@/components/user/UserBulkActions'
import UserImportExport from '@/components/user/UserImportExport'
import UserTable from '@/components/user/UserTable'
import { useFetch, useMutation } from '@/hooks/useFetch'
import { isAdmin, isOperator } from '@/lib/permissions'
import { useAdminUserStore, User, UserGroup } from '@/stores/adminUserStore'
import { PaginatedResponse } from '@/types/api'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function UserList() {
  const [mounted, setMounted] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // 从状态管理中获取用户列表状态
  const {
    users,
    totalUsers,
    currentPage,
    pageSize,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    roleFilter,
    userGroupFilter,
    emailFilter,
    registrationDateStart,
    registrationDateEnd,
    sortField,
    sortDirection,
    setUsers,
    setTotalUsers,
    setCurrentPage,
    setPageSize,
    setIsLoading,
    setError,
  } = useAdminUserStore()

  // 构建API请求URL
  const buildApiUrl = () => {
    let url = `/api/v1/users?page=${currentPage}&limit=${pageSize}`
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
    if (statusFilter) url += `&status=${statusFilter}`
    if (roleFilter) url += `&role=${roleFilter}`
    if (userGroupFilter) url += `&userGroupId=${userGroupFilter}`
    if (emailFilter) url += `&email=${encodeURIComponent(emailFilter)}`
    if (registrationDateStart) url += `&dateStart=${encodeURIComponent(registrationDateStart)}`
    if (registrationDateEnd) url += `&dateEnd=${encodeURIComponent(registrationDateEnd)}`
    if (sortField) url += `&sortField=${sortField}`
    if (sortDirection) url += `&sortDirection=${sortDirection}`
    return url
  }

  // 获取用户列表数据
  const { data, mutate } = useFetch<PaginatedResponse<User>>(
    mounted ? buildApiUrl() : null,
    {
      onSuccess: (data) => {
        if (data?.success) {
          setUsers(data.data.items)
          setTotalUsers(data.data.pagination.total)
          setIsLoading(false)
        }
      },
      onError: (error) => {
        setError(error.message)
        setIsLoading(false)
      },
      // 禁用缓存，确保每次都从服务器获取最新数据
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
    }
  )

  // 获取用户组列表
  const { data: userGroupsData } = useFetch<{ success: boolean, data: UserGroup[] }>(
    mounted ? '/api/v1/user-groups?limit=100' : null
  )

  // 删除用户的API调用
  const { delete: deleteUser, loading: deleteLoading } = useMutation<{ id: number }>('/api/v1/users')

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)

    // 页面加载时自动刷新数据
    const refreshData = async () => {
      if (typeof window !== 'undefined') {
        // 检查是否是从创建页面返回
        const referrer = document.referrer;
        if (referrer && (
          referrer.includes('/admin/users/create') ||
          referrer.includes('/admin/users/') && referrer.includes('/edit')
        )) {
          console.log('从创建/编辑页面返回，强制刷新数据');
          setIsLoading(true);
          await mutate();
        }
      }
    };

    if (mounted) {
      refreshData();
    }
  }, [mounted, mutate, setIsLoading])

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    if (mounted) {
      setIsLoading(true)
      mutate()
    }
  }, [
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    roleFilter,
    userGroupFilter,
    emailFilter,
    registrationDateStart,
    registrationDateEnd,
    sortField,
    sortDirection,
    mounted,
    mutate,
    setIsLoading
  ])

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 处理刷新数据
  const handleRefreshData = async () => {
    setIsLoading(true)
    // 清除SWR缓存并强制重新获取数据
    await mutate(undefined, { revalidate: true })
    console.log('数据已刷新')
  }

  // 处理删除用户
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const result = await deleteUser(userToDelete.id.toString())
      if (result.success) {
        // 关闭模态框
        setDeleteModalOpen(false)
        setUserToDelete(null)

        // 重新获取数据
        mutate()
      }
    } catch (error) {
      console.error('删除用户失败:', error)
    }
  }

  // 处理删除按钮点击
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  if (!mounted) return null

  return (
    <AdminLayout title="用户管理 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统中的所有用户账户
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link href="/admin/users/pending">
            <Button variant="warning">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              待审核用户
            </Button>
          </Link>
          <Link href="/admin/users/create">
            <Button>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              创建用户
            </Button>
          </Link>
          <Button variant="outline" onClick={handleRefreshData}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </Button>
        </div>
      </div>

      {/* 导入导出功能 */}
      <UserImportExport onActionComplete={handleRefreshData} />

      {/* 批量操作 */}
      <UserBulkActions
        userGroups={userGroupsData?.success ? (userGroupsData.data as any)?.items || userGroupsData.data || [] : []}
        onActionComplete={handleRefreshData}
      />

      {/* 高级筛选 */}
      <AdvancedUserFilter
        userGroups={userGroupsData?.success ? (userGroupsData.data as any)?.items || userGroupsData.data || [] : []}
        onSearch={handleRefreshData}
      />

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <UserTable
            users={users}
            isLoading={isLoading}
            error={error}
            onDeleteClick={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {totalUsers > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            共 {totalUsers} 条记录，当前第 {currentPage} 页，每页 {pageSize} 条
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalUsers / pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 删除确认模态框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
      >
        <ModalBody>
          <p>
            确定要删除用户 <strong>{userToDelete?.name}</strong> 吗？此操作不可撤销。
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
