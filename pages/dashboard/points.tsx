import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
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

// 积分类型标签组件
const PointTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { label: string; className: string }> = {
    SIGN_IN: {
      label: '签到',
      className: 'bg-blue-100 text-blue-800',
    },
    CONTENT_PUBLISH: {
      label: '发布内容',
      className: 'bg-green-100 text-green-800',
    },
    CONTENT_LIKE: {
      label: '内容点赞',
      className: 'bg-purple-100 text-purple-800',
    },
    COMMENT: {
      label: '评论',
      className: 'bg-yellow-100 text-yellow-800',
    },
    PURCHASE: {
      label: '购买',
      className: 'bg-red-100 text-red-800',
    },
    ADMIN_ADJUST: {
      label: '管理员调整',
      className: 'bg-gray-100 text-gray-800',
    },
  }

  const { label, className } = typeMap[type] || {
    label: '其他',
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

export default function PointsHistory() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  
  // 分页状态
  const [page, setPage] = useState(1)
  
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
  
  // 获取用户积分历史
  const { data: pointHistoryData } = useSWR(
    session ? `/api/v1/users/me/points/history?page=${page}&limit=10` : null,
    fetcher
  )
  
  const pointHistory = pointHistoryData?.data?.items || []
  const totalItems = pointHistoryData?.data?.totalItems || 0
  const totalPages = pointHistoryData?.data?.totalPages || 1
  
  // 处理分页变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
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
        
        // 刷新页面
        router.reload()
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
      router.push('/auth/signin?callbackUrl=/dashboard/points')
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
    <DashboardLayout title="积分明细 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">积分明细</h1>
        
        {/* 积分概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{points.balance}</p>
                <p className="text-sm text-gray-500 mt-1">当前积分</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{points.totalEarned}</p>
                <p className="text-sm text-gray-500 mt-1">累计获得</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{points.totalSpent}</p>
                <p className="text-sm text-gray-500 mt-1">累计消费</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 签到按钮 */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">每日签到</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    每日签到可获得5积分，连续签到可获得额外奖励
                  </p>
                </div>
                <Button
                  onClick={handleSignIn}
                  disabled={isSignedInToday()}
                  className="mt-4 md:mt-0"
                >
                  {isSignedInToday() ? '今日已签到' : '立即签到'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 积分历史 */}
        <Card>
          <CardHeader>
            <CardTitle>积分记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pointHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无积分记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">积分变动</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pointHistory.map((record: any) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PointTypeBadge type={record.type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={record.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {record.amount > 0 ? `+${record.amount}` : record.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{record.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        destination: '/auth/signin?callbackUrl=/dashboard/points',
        permanent: false,
      },
    }
  }
  
  return {
    props: {},
  }
}
