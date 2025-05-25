import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate } from '@/lib/date'
import { isAdmin, isOperator } from '@/lib/permissions'
import { useFetch } from '@/hooks/useFetch'

interface PendingUser {
  id: number
  uuid: string
  name: string
  email: string
  telegramUsername?: string
  telegramId?: string
  applicationReason?: string
  createdAt: string
}

export default function PendingUsers() {
  const [mounted, setMounted] = useState(false)

  // 获取待审核用户列表
  const { data: usersData, error: usersError, isLoading: usersLoading, mutate } = useFetch<{
    success: boolean
    data: PendingUser[]
  }>(mounted ? '/api/v1/users?status=PENDING&limit=100' : null)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (usersLoading) {
    return (
      <AdminLayout title="待审核用户 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (usersError || !usersData?.success) {
    return (
      <AdminLayout title="待审核用户 - 兔图管理后台">
        <Alert variant="error">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {(usersError instanceof Error ? usersError.message : usersError) || '无法加载待审核用户列表，请稍后重试'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/users">
            <Button>返回用户管理</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const pendingUsers = Array.isArray(usersData.data) ? usersData.data : 
                      (usersData.data as any)?.items || []

  return (
    <AdminLayout title="待审核用户 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">待审核用户</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理需要审核的用户申请
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline" onClick={() => mutate()}>
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
          <Link href="/admin/users">
            <Button variant="outline">
              返回用户管理
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">待审核用户</p>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户信息</TableHead>
                <TableHead>Telegram信息</TableHead>
                <TableHead>申请原因</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    暂无待审核用户
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.telegramUsername && (
                          <div className="text-gray-900">@{user.telegramUsername}</div>
                        )}
                        {user.telegramId && (
                          <div className="text-blue-600">ID: {user.telegramId}</div>
                        )}
                        {!user.telegramUsername && !user.telegramId && (
                          <span className="text-gray-400">未填写</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {user.applicationReason ? (
                          <p className="text-sm text-gray-700 truncate" title={user.applicationReason}>
                            {user.applicationReason}
                          </p>
                        ) : (
                          <span className="text-gray-400 text-sm">未填写</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/admin/users/${user.id}`}>
                          <Button variant="outline" size="sm">
                            查看详情
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || (!isOperator(session) && !isAdmin(session))) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/users/pending',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
