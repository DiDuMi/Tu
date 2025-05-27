import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useSWR from 'swr'

import NewHomeSidebarLayout from '@/components/layout/NewHomeSidebarLayout'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { fetcher } from '@/lib/api'

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)

  // 获取用户积分信息
  const { data: pointsData, mutate: mutatePoints } = useSWR(
    session ? '/api/v1/users/me/points' : null,
    fetcher
  )

  // 获取今日签到状态
  const { data: signInData, mutate: mutateSignIn } = useSWR(
    session ? '/api/v1/users/me/signin/status' : null,
    fetcher
  )

  // 获取签到统计
  const { data: statsData } = useSWR(
    session ? '/api/v1/users/me/signin/stats' : null,
    fetcher
  )

  const points = pointsData?.data || { balance: 0 }
  const signInStatus = signInData?.data || { canSignIn: true, signedInToday: false }
  const stats = statsData?.data?.user_stats || {
    total_sign_ins: 0,
    current_streak: 0,
    longest_streak: 0,
    total_points_from_signin: 0,
    sources: {}
  }

  // 处理未登录用户重定向
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // 处理签到
  const handleSignIn = async () => {
    if (!session || isSigningIn || signInStatus.signedInToday) return

    setIsSigningIn(true)
    try {
      const response = await fetch('/api/v1/users/me/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        // 刷新数据
        mutatePoints()
        mutateSignIn()

        // 显示成功消息
        alert(`签到成功！获得 ${result.data.pointsEarned} 积分`)
      } else {
        alert(result.error?.message || '签到失败')
      }
    } catch (error) {
      console.error('签到失败:', error)
      alert('签到失败，请稍后重试')
    } finally {
      setIsSigningIn(false)
    }
  }

  // 显示加载状态
  if (status === 'loading') {
    return (
      <NewHomeSidebarLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </NewHomeSidebarLayout>
    )
  }

  // 未登录用户显示提示（重定向在useEffect中处理）
  if (status === 'unauthenticated') {
    return (
      <NewHomeSidebarLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">请先登录以访问签到功能</p>
            <Link href="/auth/signin">
              <Button>前往登录</Button>
            </Link>
          </div>
        </div>
      </NewHomeSidebarLayout>
    )
  }

  return (
    <NewHomeSidebarLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageTitle
          title="每日签到"
          description="每日签到获取积分奖励"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 签到卡片 */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                每日签到
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {signInStatus.signedInToday
                  ? '今日已签到，明天再来吧！'
                  : '点击下方按钮完成今日签到'}
              </p>

              <Button
                onClick={handleSignIn}
                disabled={isSigningIn || signInStatus.signedInToday}
                className="w-full"
                variant={signInStatus.signedInToday ? 'secondary' : 'primary'}
              >
                {isSigningIn
                  ? '签到中...'
                  : signInStatus.signedInToday
                    ? '已签到'
                    : '立即签到'}
              </Button>
            </CardContent>
          </Card>

          {/* 积分信息 */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                我的积分
              </h3>

              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {points.balance}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                当前积分余额
              </p>
            </CardContent>
          </Card>

          {/* 连续签到 */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔥</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                连续签到
              </h3>

              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.current_streak}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                当前连续天数
              </p>
            </CardContent>
          </Card>

          {/* 总签到次数 */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                总签到
              </h3>

              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.total_sign_ins}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm">
                累计签到次数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 签到统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>签到统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">最长连续签到</span>
                  <span className="font-semibold">{stats.longest_streak} 天</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">签到获得积分</span>
                  <span className="font-semibold">{stats.total_points_from_signin} 分</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">签到率（30天）</span>
                  <span className="font-semibold">{Math.round((stats.sign_in_rate || 0) * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>签到来源</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.sources).map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">
                      {source === 'web' ? '网页' :
                       source === 'telegram_bot' ? 'Telegram Bot' :
                       source === 'api' ? 'API' : source}
                    </span>
                    <span className="font-semibold">{count} 次</span>
                  </div>
                ))}
                {Object.keys(stats.sources).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center">暂无签到记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 签到规则 */}
        <Card>
          <CardHeader>
            <CardTitle>签到规则</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>每日可签到一次，获得基础积分奖励</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>连续签到3天额外+5分，7天额外+10分</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>积分可用于兑换平台特权和奖品</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>签到时间为每日0点至23:59</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </NewHomeSidebarLayout>
  )
}
