import { ReactNode, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'

import { isAdmin, isOperator } from '@/lib/permissions'
import { useUIStore } from '@/stores/uiStore'

import AdminMobileMenu from './AdminMobileMenu'
import AdminNavLinks from './AdminNavLinks'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export default function AdminLayout({
  children,
  title = '管理后台 - 兔图内容管理平台',
  description = '兔图内容管理平台管理后台',
}: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const [mounted, setMounted] = useState(false)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 检查用户是否有权限访问管理后台
  useEffect(() => {
    if (mounted && status !== 'loading') {
      if (!session || (!isOperator(session) && !isAdmin(session))) {
        router.push('/auth/signin?callbackUrl=/admin')
      }
    }
  }, [session, status, router, mounted])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  // 如果会话正在加载，显示加载状态
  if (status === 'loading' || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // 如果用户未登录或没有权限，不显示内容
  if (!session || (!isOperator(session) && !isAdmin(session))) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-primary-600">
                  兔图管理后台
                </Link>
              </div>
              <AdminNavLinks session={session} />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  返回前台
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  退出
                </button>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    {session.user.name}
                  </span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session.user.image || 'https://via.placeholder.com/40'}
                    alt={session.user.name || '用户头像'}
                  />
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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
      <AdminMobileMenu
        session={session}
        isOpen={sidebarOpen}
        onSignOut={handleSignOut}
      />

      {/* 主要内容 */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} 兔图内容管理平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
