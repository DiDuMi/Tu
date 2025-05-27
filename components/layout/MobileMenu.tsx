import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { useUIStore } from '@/stores/uiStore'
import { useNavigation } from '@/hooks/useNavigation'

import SafeImage from '@/components/ui/SafeImage'
import ThemeSwitcher from './ThemeSwitcher'

export default function MobileMenu() {
  const { data: session } = useSession()
  const { sidebarOpen } = useUIStore()
  const { navLinks, isActive } = useNavigation()

  if (!sidebarOpen) {
    return null
  }

  return (
    <div className="sm:hidden bg-white dark:bg-dark-card dark:border-b dark:border-dark-border">
      <div className="pt-2 pb-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive(link.href, link.exact)
                ? 'border-primary-500 text-primary-700 bg-primary-50 dark:text-dark-primary dark:bg-dark-border/50'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:bg-dark-border dark:hover:border-dark-border dark:hover:text-dark-text'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="pt-4 pb-3 border-t border-gray-200 dark:border-dark-border">
        {session ? (
          <>
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <SafeImage
                  className="h-10 w-10 rounded-full object-cover"
                  src={session.user.image || '/images/default-avatar.svg'}
                  alt={session.user.name || '用户头像'}
                  width={40}
                  height={40}
                  highPriority
                />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-dark-text">
                  {session.user.name}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                  {session.user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
              >
                控制台
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
              >
                个人中心
              </Link>
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
              >
                设置
              </Link>
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
                >
                  管理后台
                </Link>
              )}
              <Link
                href="/search"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
              >
                搜索
              </Link>
              <div className="px-4 py-2">
                <ThemeSwitcher />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-1">
            <Link
              href="/auth/signin"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
            >
              登录
            </Link>
            <Link
              href="/auth/signup"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
            >
              注册
            </Link>
            <div className="px-4 py-2">
              <ThemeSwitcher />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
