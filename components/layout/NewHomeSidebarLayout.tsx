import React, { ReactNode, useEffect } from 'react'
import Head from 'next/head'
import NewHomeSidebar from './NewHomeSidebar'
import { useUIStore } from '@/stores/uiStore'

interface NewHomeSidebarLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  keywords?: string[]
}

export default function NewHomeSidebarLayout({
  children,
  title = '兔图内容平台',
  description = '创作、分享、发现 - 兔图内容平台',
  keywords = ['内容平台', '知识分享', '社区']
}: NewHomeSidebarLayoutProps) {
  // 使用 Zustand store 管理侧边栏状态
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  // 确保桌面端侧边栏默认展开（仅在初始化时）
  useEffect(() => {
    // 只在组件首次挂载时检查，不监听sidebarOpen变化
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024 // lg breakpoint
      // 只有在桌面端且侧边栏当前是关闭状态时才自动展开
      // 这样用户手动关闭后不会被强制重新打开
      if (isDesktop && !sidebarOpen) {
        console.log('[NewHomeSidebarLayout] 初始化：桌面端自动展开侧边栏')
        setSidebarOpen(true)
      }
    }
  }, []) // 移除依赖项，只在组件挂载时执行一次

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* 桌面端侧边栏 - 支持展开/收起，包含logo */}
          <div className={`hidden lg:block transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-80 flex-shrink-0' : 'w-0'
          }`}>
            <div className={`fixed left-0 top-0 h-screen w-80 overflow-y-auto transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
              <NewHomeSidebar />
            </div>
          </div>

          {/* 移动端顶部横栏（仅在移动端显示，包含logo和菜单按钮） */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:bg-gray-800/80 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-4">
              {/* 移动端Logo */}
              <div className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  兔
                </div>
                <span>兔图</span>
              </div>

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-700"
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

          {/* 移动端侧边栏覆盖层 */}
          {sidebarOpen && (
            <>
              {/* 背景遮罩 */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={closeSidebar}
              />
              {/* 侧边栏 */}
              <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 z-50 lg:hidden">
                <NewHomeSidebar onLinkClick={closeSidebar} />
              </div>
            </>
          )}

          {/* 主要内容区域 - 响应侧边栏状态 */}
          <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
          }`}>
            {/* 桌面端展开按钮（当侧边栏收起时显示） */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden lg:flex fixed top-4 left-4 z-50 items-center justify-center p-3 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
                title="展开侧边栏"
              >
                <span className="sr-only">展开侧边栏</span>
                <svg
                  className="h-6 w-6"
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
              </button>
            )}

            <div className="pt-16 lg:pt-0">
              <div className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
