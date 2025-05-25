import React from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface ContentPreviewLimitProps {
  previewPercentage: number
  onUpgradeClick?: () => void
  className?: string
}

export default function ContentPreviewLimit({
  previewPercentage,
  onUpgradeClick,
  className = ''
}: ContentPreviewLimitProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // 如果允许完整预览，不显示组件
  if (previewPercentage >= 100) {
    return null
  }

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else if (!session) {
      // 未登录用户跳转到登录页
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)
    } else {
      // 已登录用户跳转到会员升级页（这里可以根据实际需求调整）
      router.push('/user/profile')
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>
      
      {/* 提示信息 */}
      <div className="absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 p-6 text-center z-20">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            内容预览限制
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            您当前只能查看 <span className="font-semibold text-primary-600">{previewPercentage}%</span> 的内容
            {!session && '，请登录以获取更多访问权限'}
            {session && '，升级会员可查看完整内容'}
          </p>
          
          <Button
            onClick={handleUpgradeClick}
            className="w-full sm:w-auto"
          >
            {!session ? '立即登录' : '了解更多'}
          </Button>
        </div>
      </div>
    </div>
  )
}
