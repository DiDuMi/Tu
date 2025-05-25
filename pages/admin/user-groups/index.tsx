import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import UserGroupList from '@/components/user-groups/UserGroupList'
import { useFetch } from '@/hooks/useFetch'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useAdminUserStore, UserGroup } from '@/stores/adminUserStore'
import { PaginatedResponse } from '@/types/api'

export default function UserGroupListPage() {
  const _router = useRouter()
  const [mounted, setMounted] = useState(false)

  // 从状态管理中获取用户组列表状态
  const {
    userGroups,
    totalUserGroups,
    userGroupsCurrentPage,
    userGroupsPageSize,
    userGroupsIsLoading,
    userGroupsError,
    userGroupsSearchTerm,
    setUserGroups,
    setTotalUserGroups,
    setUserGroupsCurrentPage,
    setUserGroupsPageSize,
    setUserGroupsIsLoading,
    setUserGroupsError,
    setUserGroupsSearchTerm,
    resetUserGroupFilters,
  } = useAdminUserStore()

  // 构建API请求URL
  const buildApiUrl = () => {
    let url = `/api/v1/user-groups?page=${userGroupsCurrentPage}&limit=${userGroupsPageSize}`
    if (userGroupsSearchTerm) url += `&search=${encodeURIComponent(userGroupsSearchTerm)}`
    return url
  }

  // 获取用户组列表数据
  const { data: _data, mutate } = useFetch<PaginatedResponse<UserGroup>>(
    mounted ? buildApiUrl() : null,
    {
      onSuccess: (data) => {
        if (data?.success) {
          setUserGroups(data.data.items)
          setTotalUserGroups(data.data.pagination.total)
          setUserGroupsIsLoading(false)
        }
      },
      onError: (error) => {
        setUserGroupsError(error.message)
        setUserGroupsIsLoading(false)
      },
      // 禁用缓存，确保每次都从服务器获取最新数据
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
    }
  )

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)

    // 页面加载时自动刷新数据
    const refreshData = async () => {
      if (typeof window !== 'undefined') {
        // 检查是否是从创建页面返回
        const referrer = document.referrer;
        if (referrer && (
          referrer.includes('/admin/user-groups/create') ||
          referrer.includes('/admin/user-groups/') && referrer.includes('/edit')
        )) {
          console.log('从创建/编辑页面返回，强制刷新数据');
          setUserGroupsIsLoading(true);
          await mutate();
        }
      }
    };

    if (mounted) {
      refreshData();
    }
  }, [mounted, mutate, setUserGroupsIsLoading])

  // 当筛选条件变化时重新获取数据
  useEffect(() => {
    if (mounted) {
      setUserGroupsIsLoading(true)
      mutate()
    }
  }, [userGroupsCurrentPage, userGroupsPageSize, userGroupsSearchTerm, mounted, mutate, setUserGroupsIsLoading])

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setUserGroupsCurrentPage(page)
  }

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setUserGroupsCurrentPage(1) // 重置到第一页
    mutate()
  }

  // 处理重置筛选
  const handleResetFilters = () => {
    resetUserGroupFilters()
    mutate()
  }

  // 处理删除后的刷新
  const handleAfterDelete = () => {
    mutate()
  }

  if (!mounted) return null

  return (
    <AdminLayout title="用户组管理 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户组管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统中的用户组和权限
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={async () => {
                setUserGroupsIsLoading(true);
                await mutate(undefined, { revalidate: true });
                console.log('用户组数据已刷新');
              }}
            >
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
            <Link href="/admin/user-groups/create">
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
                创建用户组
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="搜索用户组名称或描述"
                value={userGroupsSearchTerm}
                onChange={(e) => setUserGroupsSearchTerm(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button type="submit" variant="default">
                  搜索
                </Button>
                <Button type="button" variant="outline" onClick={handleResetFilters}>
                  重置
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 游客权限说明 */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            游客权限管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700">
            <p className="mb-3">
              <strong>游客</strong>是指未注册或未登录的用户，他们不属于任何用户组。游客权限需要单独配置。
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-3 sm:mb-0">
                <p className="text-sm">
                  游客权限包括：内容查看、搜索、视频播放、互动功能等权限设置
                </p>
              </div>
              <Link href="/admin/settings/guest-permissions">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  管理游客权限
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <UserGroupList
            userGroups={userGroups}
            isLoading={userGroupsIsLoading}
            error={userGroupsError}
            onDelete={handleAfterDelete}
          />
        </CardContent>
      </Card>

      {totalUserGroups > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            共 {totalUserGroups} 条记录，当前第 {userGroupsCurrentPage} 页，每页 {userGroupsPageSize} 条
          </div>
          <Pagination
            currentPage={userGroupsCurrentPage}
            totalPages={Math.ceil(totalUserGroups / userGroupsPageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}


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
