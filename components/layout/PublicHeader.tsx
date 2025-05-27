import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { useUIStore } from '@/stores/uiStore'
import { useNavigation } from '@/hooks/useNavigation'

import SearchBar from './SearchBar'
import ThemeSwitcher from './ThemeSwitcher'
import UserDropdown from './UserDropdown'
import LayoutSwitcher from './LayoutSwitcher'

interface PublicHeaderProps {
  showSearch?: boolean
}

export default function PublicHeader({ showSearch = true }: PublicHeaderProps) {
  const { data: session } = useSession()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { navLinks, isActive } = useNavigation()

  return (
    <header id="navigation" className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:bg-dark-card/80 dark:border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-dark-primary hover:text-primary-700 dark:hover:text-dark-primary/90 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  兔
                </div>
                <span>兔图</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href, link.exact)
                      ? 'bg-primary-50 dark:bg-dark-primary/10 text-primary-600 dark:text-dark-primary'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* 搜索框 */}
            {showSearch && (
              <div className="mr-4">
                <SearchBar />
              </div>
            )}

            {/* 布局切换器 */}
            <div className="mr-4">
              <LayoutSwitcher />
            </div>

            {/* 主题切换器 */}
            <div className="mr-4">
              <ThemeSwitcher />
            </div>

            {session ? (
              <div className="ml-3 relative">
                <UserDropdown user={session.user} />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text"
                >
                  登录
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
            >
              <span className="sr-only">打开主菜单</span>
              <svg
                className={`${sidebarOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${sidebarOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export type { PublicHeaderProps }
