import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useFetch } from '@/hooks/useFetch'
import { isAdmin, isOperator } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false)

  // 获取统计数据
  const { data: userStats } = useFetch<{ total: number; active: number; pending: number }>('/api/v1/stats/users')
  const { data: pageStats } = useFetch<{ total: number; published: number; draft: number }>('/api/v1/stats/pages')
  const { data: mediaStats } = useFetch<{ total: number; images: number; videos: number }>('/api/v1/stats/media')

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AdminLayout title="控制台 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
        <p className="mt-1 text-sm text-gray-500">
          欢迎使用兔图内容管理平台管理后台
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 用户统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>用户统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总用户数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(userStats as any)?.data?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">活跃用户</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(userStats as any)?.data?.active || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">待审核</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(userStats as any)?.data?.pending || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 内容统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>内容统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总内容数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(pageStats as any)?.data?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-full">
                <svg
                  className="w-6 h-6 text-secondary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">已发布</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(pageStats as any)?.data?.published || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">草稿</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(pageStats as any)?.data?.draft || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 媒体统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>媒体统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">总媒体数</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(mediaStats as any)?.data?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <svg
                  className="w-6 h-6 text-success-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">图片</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(mediaStats as any)?.data?.images || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">视频</p>
                <p className="text-xl font-semibold text-gray-900">
                  {(mediaStats as any)?.data?.videos || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">快速操作</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/users/create"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">创建用户</h5>
            <p className="text-sm text-gray-500">添加新用户到系统</p>
          </Link>
          <Link
            href="/admin/content/create"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">创建内容</h5>
            <p className="text-sm text-gray-500">添加新内容到系统</p>
          </Link>
          <Link
            href="/admin/media/upload"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">上传媒体</h5>
            <p className="text-sm text-gray-500">上传新媒体文件</p>
          </Link>
          <Link
            href="/admin/settings"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">系统设置</h5>
            <p className="text-sm text-gray-500">管理系统配置</p>
          </Link>
          <Link
            href="/admin/settings/logs"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">系统日志</h5>
            <p className="text-sm text-gray-500">查看系统操作日志</p>
          </Link>
          <Link
            href="/admin/settings/backups"
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <h5 className="mb-2 text-lg font-medium text-gray-900">系统备份</h5>
            <p className="text-sm text-gray-500">管理系统备份与恢复</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || (!isOperator(session) && !isAdmin(session))) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
