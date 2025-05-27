import { ReactNode, useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'

import { isAdmin, isOperator } from '@/lib/permissions'
import { useUIStore } from '@/stores/uiStore'

import AdminNavLinks from './AdminNavLinks'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  user?: {
    id: string
    name: string
    role: string
  }
}

export default function AdminLayout({
  children,
  title = '管理后台 - 兔图内容管理平台',
  description = '兔图内容管理平台管理后台',
  user,
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
    <div className="min-h-screen bg-gray-50 flex">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center">
              <span className="text-2xl">🐰</span>
              <span className="ml-2 text-lg font-bold text-gray-900">兔图管理</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 导航菜单 */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <AdminNavLinks session={session} onClick={() => setSidebarOpen(false)} />
          </div>

          {/* 侧边栏底部 */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <img
                className="h-10 w-10 rounded-full"
                src={session.user.image || 'https://via.placeholder.com/40'}
                alt={session.user.name || '用户头像'}
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.role === 'ADMIN' ? '管理员' : '运营'}</p>
              </div>
              <div className="ml-3 flex flex-col space-y-1">
                <Link
                  href="/"
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="返回前台"
                >
                  🏠
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  title="退出登录"
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">兔图管理后台</span>
            <div className="w-10"></div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
