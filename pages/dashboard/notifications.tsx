import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { fetcher } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function Notifications() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  
  // 分页状态
  const [page, setPage] = useState(1)
  
  // 获取用户通知
  const { data: notificationsData, mutate } = useSWR(
    session ? `/api/v1/users/me/notifications?page=${page}&limit=20` : null,
    fetcher
  )
  
  const notifications = notificationsData?.data?.items || []
  const totalItems = notificationsData?.data?.totalItems || 0
  const totalPages = notificationsData?.data?.totalPages || 1
  const unreadCount = notificationsData?.data?.unreadCount || 0
  
  // 处理分页变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // 标记通知为已读
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/users/me/notifications/${id}/read`, {
        method: 'PATCH',
      })
      
      if (response.ok) {
        // 刷新通知列表
        mutate()
      }
    } catch (error) {
      console.error('标记通知为已读时出错:', error)
    }
  }
  
  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/users/me/notifications/read-all', {
        method: 'PATCH',
      })
      
      if (response.ok) {
        // 刷新通知列表
        mutate()
      }
    } catch (error) {
      console.error('标记所有通知为已读时出错:', error)
    }
  }
  
  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin?callbackUrl=/dashboard/notifications')
    }
  }, [session, isLoading, router])
  
  if (isLoading || !session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }
  
  return (
    <DashboardLayout title="我的通知 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的通知</h1>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              全部标为已读
            </Button>
          )}
        </div>
        
        {/* 通知列表 */}
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无通知</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification: any) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-primary-500'}`}></div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-900`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        
                        {notification.link && (
                          <div className="mt-2">
                            <Link href={notification.link}>
                              <Button variant="outline" size="sm">
                                查看详情
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/notifications',
        permanent: false,
      },
    }
  }
  
  return {
    props: {},
  }
}
