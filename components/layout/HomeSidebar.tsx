import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import useSWR from 'swr'

import SafeImage from '@/components/ui/SafeImage'
import SignInCard from '@/components/ui/SignInCard'
import SidebarSearchBar from '@/components/layout/SidebarSearchBar'
import { useUIStore } from '@/stores/uiStore'
import { fetcher } from '@/lib/api'

interface HomeSidebarProps {
  className?: string
  forceExpanded?: boolean // 强制展开，用于移动端
}

export default function HomeSidebar({ className = '', forceExpanded = false }: HomeSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { homeSidebarExpanded, toggleHomeSidebar } = useUIStore()

  // 如果强制展开（移动端），则忽略全局状态
  const isExpanded = forceExpanded || homeSidebarExpanded

  // 获取用户积分信息
  const { data: pointsData } = useSWR(
    session ? '/api/v1/users/me/points' : null,
    fetcher
  )

  const points = pointsData?.data || { balance: 0 }

  // 侧边栏菜单项配置
  const menuItems = [
    {
      id: 'profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: '个人资料',
      href: '/dashboard/profile',
      description: '查看和编辑个人信息',
      requireAuth: true
    },
    {
      id: 'settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: '系统设置',
      href: '/dashboard/settings',
      description: '个性化设置和偏好配置',
      requireAuth: true
    },
    {
      id: 'announcements',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      label: '公告',
      href: '/categories/announcements',
      description: '查看最新系统公告和通知',
      requireAuth: false
    },
    {
      id: 'tutorials',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      label: '教程',
      href: '/categories/tutorials',
      description: '学习平台使用技巧和方法',
      requireAuth: false
    },
    {
      id: 'guides',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: '说明文档',
      href: '/categories/guides',
      description: '详细的功能说明和帮助文档',
      requireAuth: false
    }
  ]

  return (
    <div className={`bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 ${className}`}>
      <div className="p-4 space-y-4 lg:space-y-6">
        {/* 用户信息区域 */}
        {session ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <SafeImage
                className="h-12 w-12 rounded-full object-cover"
                src={session.user.image || '/images/default-avatar.svg'}
                alt={session.user.name || '用户头像'}
                width={48}
                height={48}
                highPriority
              />
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                    积分: {points.balance}
                  </p>
                </div>
              )}
            </div>

            {/* 签到功能 */}
            {isExpanded && (
              <div className="mt-3">
                <SignInCard className="w-full" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-dark-border flex items-center justify-center">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            {isExpanded && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">
                  登录后享受更多功能
                </p>
                <div className="space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block w-full px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90 border border-primary-200 dark:border-dark-primary/30 rounded-md hover:bg-primary-50 dark:hover:bg-dark-primary/10 transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block w-full px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                  >
                    注册
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 搜索功能 */}
        <div className="space-y-2">
          {isExpanded ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500 dark:text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text">搜索</span>
              </div>
              <div className="mt-2">
                <SidebarSearchBar />
              </div>
            </div>
          ) : (
            <button
              onClick={() => router.push('/search')}
              className="flex items-center justify-center w-full px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border/50 transition-colors"
              title="搜索"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* 菜单项 */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            // 如果需要登录但用户未登录，则不显示
            if (item.requireAuth && !session) {
              return null
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center rounded-md text-sm font-medium transition-colors ${
                  isExpanded ? 'space-x-3 px-3 py-2' : 'justify-center px-2 py-3'
                } ${
                  router.pathname.startsWith(item.href)
                    ? 'bg-primary-50 dark:bg-dark-primary/10 text-primary-600 dark:text-dark-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border/50'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {isExpanded && (
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted/80 truncate">
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 更多功能按钮 - 仅在桌面端显示 */}
        <div className="pt-4 border-t border-gray-200 dark:border-dark-border hidden lg:block">
          <button
            onClick={toggleHomeSidebar}
            className={`flex items-center w-full rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border/50 transition-colors ${
              isExpanded ? 'space-x-3 px-3 py-2' : 'justify-center px-2 py-3'
            }`}
            title={!isExpanded ? '展开菜单' : '收起菜单'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isExpanded && (
              <span>收起菜单</span>
            )}
            {!isExpanded && (
              <span className="sr-only">展开菜单</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
