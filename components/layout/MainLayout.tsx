import { ReactNode, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'

import SearchBar from '@/components/layout/SearchBar'
import SafeImage from '@/components/ui/SafeImage'
import { useUIStore } from '@/stores/uiStore'
import ThemeSwitcher from '@/components/layout/ThemeSwitcher'

interface MainLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export default function MainLayout({
  children,
  title = '兔图内容管理平台',
  description = '兔图内容管理平台，提供自主可控的内容创建、编辑和发布功能',
}: MainLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-bg">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm dark:bg-dark-card dark:border-b dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-600 dark:text-dark-primary">
                  兔图
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname === '/'
                      ? 'border-primary-500 text-gray-900 dark:text-dark-text'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:border-dark-border dark:hover:text-dark-text'
                  }`}
                >
                  首页
                </Link>
                <Link
                  href="/pages"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname.startsWith('/pages')
                      ? 'border-primary-500 text-gray-900 dark:text-dark-text'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:border-dark-border dark:hover:text-dark-text'
                  }`}
                >
                  内容
                </Link>
                <Link
                  href="/media"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    router.pathname.startsWith('/media')
                      ? 'border-primary-500 text-gray-900 dark:text-dark-text'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:border-dark-border dark:hover:text-dark-text'
                  }`}
                >
                  媒体库
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* 搜索框 */}
              <div className="mr-4">
                <SearchBar />
              </div>

              {/* 主题切换器 */}
              <div className="mr-4">
                <ThemeSwitcher />
              </div>

              {session ? (
                <div className="ml-3 relative flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text"
                  >
                    控制台
                  </Link>
                  <Link
                    href="/dashboard/favorites"
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text"
                  >
                    收藏
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text"
                  >
                    退出
                  </button>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2 dark:text-dark-text">
                      {session.user.name}
                    </span>
                    <SafeImage
                      className="h-8 w-8 rounded-full object-cover"
                      src={session.user.image || '/images/default-avatar.svg'}
                      alt={session.user.name || '用户头像'}
                      width={32}
                      height={32}
                      highPriority
                    />
                  </div>
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
      </nav>

      {/* 移动端菜单 */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} sm:hidden bg-white dark:bg-dark-card dark:border-b dark:border-dark-border`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              router.pathname === '/'
                ? 'border-primary-500 text-primary-700 bg-primary-50 dark:text-dark-primary dark:bg-dark-border/50'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:bg-dark-border dark:hover:border-dark-border dark:hover:text-dark-text'
            }`}
          >
            首页
          </Link>
          <Link
            href="/pages"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              router.pathname.startsWith('/pages')
                ? 'border-primary-500 text-primary-700 bg-primary-50 dark:text-dark-primary dark:bg-dark-border/50'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:bg-dark-border dark:hover:border-dark-border dark:hover:text-dark-text'
            }`}
          >
            内容
          </Link>
          <Link
            href="/media"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              router.pathname.startsWith('/media')
                ? 'border-primary-500 text-primary-700 bg-primary-50 dark:text-dark-primary dark:bg-dark-border/50'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-dark-muted dark:hover:bg-dark-border dark:hover:border-dark-border dark:hover:text-dark-text'
            }`}
          >
            媒体库
          </Link>
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
                  href="/dashboard/favorites"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
                >
                  收藏
                </Link>
                <Link
                  href="/search"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
                >
                  搜索
                </Link>
                <div className="px-4 py-2">
                  <ThemeSwitcher />
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
                >
                  退出
                </button>
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

      {/* 主要内容 */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white dark:bg-dark-card dark:border-t dark:border-dark-border">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-dark-muted">
            &copy; {new Date().getFullYear()} 兔图内容管理平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
