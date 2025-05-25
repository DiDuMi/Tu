import { useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { fetcher } from '@/lib/api'

interface SignInCardProps {
  className?: string
}

export default function SignInCard({ className = '' }: SignInCardProps) {
  const { data: session } = useSession()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInMessage, setSignInMessage] = useState('')

  // 获取用户积分信息
  const { data: pointsData, mutate: mutatePoints } = useSWR(
    session ? '/api/v1/users/me/points' : null,
    fetcher
  )

  const points = pointsData?.data || { balance: 0, lastSignIn: null }
  const today = new Date().toDateString()
  const lastSignInDate = points.lastSignIn ? new Date(points.lastSignIn).toDateString() : null
  const hasSignedInToday = lastSignInDate === today

  // 处理签到
  const handleSignIn = async () => {
    if (!session || hasSignedInToday || isSigningIn) return

    try {
      setIsSigningIn(true)
      const response = await fetch('/api/v1/users/me/sign-in', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSignInMessage(`签到成功！获得 ${result.data.pointsEarned} 积分`)
        // 刷新数据
        mutatePoints()
        
        // 3秒后清除消息
        setTimeout(() => setSignInMessage(''), 3000)
      } else {
        setSignInMessage(result.error?.message || '签到失败')
        setTimeout(() => setSignInMessage(''), 3000)
      }
    } catch (error) {
      console.error('签到失败:', error)
      setSignInMessage('签到失败，请稍后重试')
      setTimeout(() => setSignInMessage(''), 3000)
    } finally {
      setIsSigningIn(false)
    }
  }

  // 如果用户未登录，不显示签到卡片
  if (!session) {
    return null
  }

  return (
    <div className={`bg-white dark:bg-dark-card rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text">每日签到</h3>
            <p className="text-xs text-gray-500 dark:text-dark-muted">
              当前积分: {points.balance}
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {hasSignedInToday ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-600 dark:text-green-400">今日已签到</span>
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 shadow-sm"
            >
              {isSigningIn ? '签到中...' : '签到'}
            </Button>
          )}
        </div>
      </div>
      
      {signInMessage && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
          {signInMessage}
        </div>
      )}
    </div>
  )
}
