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
import { fetcher } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useUserStore } from '@/stores/userStore'
import SafeImage from '@/components/ui/SafeImage'

export default function Dashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // 使用Zustand状态管理
  const { user, fetchUserProfile } = useUserStore()

  // 获取用户统计数据
  const { data: statsData } = useSWR(
    session ? '/api/v1/users/me/stats' : null,
    fetcher
  )

  const stats = statsData?.data || {
    contentCount: 0,
    commentCount: 0,
    likeCount: 0,
    viewCount: 0,
  }

  // 获取用户最近内容
  const { data: recentContentsData } = useSWR(
    session ? '/api/v1/users/me/contents?limit=5' : null,
    fetcher
  )

  const recentContents = recentContentsData?.data?.items || []

  // 获取用户积分信息
  const { data: pointsData } = useSWR(
    session ? '/api/v1/users/me/points' : null,
    fetcher
  )

  const points = pointsData?.data || {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastSignIn: null,
  }

  // 获取用户通知
  const { data: notificationsData } = useSWR(
    session ? '/api/v1/users/me/notifications?limit=5' : null,
    fetcher
  )

  const notifications = notificationsData?.data?.items || []

  // 加载用户资料
  useEffect(() => {
    if (session) {
      fetchUserProfile()
    }
  }, [session, fetchUserProfile])

  // 处理签到
  const handleSignIn = async () => {
    try {
      const response = await fetch('/api/v1/users/me/sign-in', {
        method: 'POST',
      })

      if (response.ok) {
        // 刷新积分数据
        const pointsResponse = await fetch('/api/v1/users/me/points')
        const pointsData = await pointsResponse.json()

        // 显示签到成功提示
        alert('签到成功！获得积分 +5')
      }
    } catch (error) {
      console.error('签到失败:', error)
    }
  }

  // 检查今日是否已签到
  const isSignedInToday = () => {
    if (!points.lastSignIn) return false

    const lastSignIn = new Date(points.lastSignIn)
    const today = new Date()

    return (
      lastSignIn.getDate() === today.getDate() &&
      lastSignIn.getMonth() === today.getMonth() &&
      lastSignIn.getFullYear() === today.getFullYear()
    )
  }

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin?callbackUrl=/dashboard')
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
    <DashboardLayout>
      <Head>
        <title>个人中心 - 兔图</title>
        <meta name="description" content="兔图内容管理平台个人中心" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人中心</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：用户资料和积分 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 用户资料卡片 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
                    {user && user.avatar ? (
                      <SafeImage
                        src={user.avatar}
                        alt={(user && user.name) || '用户头像'}
                        fill
                        sizes="96px"
                        className="object-cover"
                        highPriority
                      />
                    ) : (
                      <SafeImage
                        src="/images/default-avatar.svg"
                        alt={(user && user.name) || '用户头像'}
                        fill
                        sizes="96px"
                        className="object-cover"
                        highPriority
                      />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{user && user.name}</h2>
                  <p className="text-gray-500 mt-1">{user && user.email}</p>

                  <div className="mt-4 w-full">
                    <Link href="/dashboard/profile">
                      <Button variant="outline" className="w-full">
                        编辑资料
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 积分卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>我的积分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-primary-600">{points.balance}</p>
                  <p className="text-sm text-gray-500">当前积分</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <p className="font-medium">{points.totalEarned}</p>
                    <p className="text-xs text-gray-500">累计获得</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{points.totalSpent}</p>
                    <p className="text-xs text-gray-500">累计消费</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={handleSignIn}
                    disabled={isSignedInToday()}
                  >
                    {isSignedInToday() ? '今日已签到' : '每日签到'}
                  </Button>

                  <Link href="/dashboard/points">
                    <Button variant="outline">积分明细</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：统计数据和最近内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-primary-600">{stats.contentCount}</p>
                <p className="text-sm text-gray-500">发布内容</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-primary-600">{stats.commentCount}</p>
                <p className="text-sm text-gray-500">评论</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-primary-600">{stats.likeCount}</p>
                <p className="text-sm text-gray-500">获赞</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-primary-600">{stats.viewCount}</p>
                <p className="text-sm text-gray-500">浏览量</p>
              </div>
            </div>

            {/* 最近内容 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>最近内容</CardTitle>
                <Link href="/dashboard/contents">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentContents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">暂无内容</p>
                    <Link href="/dashboard/contents/create">
                      <Button className="mt-2">发布新内容</Button>
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentContents.map((content: any) => (
                      <li key={content.id} className="py-3">
                        <div className="flex justify-between">
                          <Link
                            href={`/pages/${content.uuid}`}
                            className="text-gray-900 hover:text-primary-600 font-medium truncate"
                          >
                            {content.title}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <span className="mr-3">{content.viewCount} 浏览</span>
                          <span className="mr-3">{content.likeCount} 点赞</span>
                          <span>{content.commentCount} 评论</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* 通知 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>最新通知</CardTitle>
                <Link href="/dashboard/notifications">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">暂无通知</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {notifications.map((notification: any) => (
                      <li key={notification.id} className="py-3">
                        <div className="flex items-start">
                          <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-1 ${notification.read ? 'bg-gray-300' : 'bg-primary-500'}`}></div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
