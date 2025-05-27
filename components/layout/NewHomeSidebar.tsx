import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import ThemeSwitcher from './ThemeSwitcher'
import { useUIStore } from '@/stores/uiStore'

interface NewHomeSidebarProps {
  className?: string
  onLinkClick?: () => void
}

export default function NewHomeSidebar({ className = '', onLinkClick }: NewHomeSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  // 监听路由错误，防止导航失效
  useEffect(() => {
    const handleRouteError = (err: any, url: string) => {
      console.error(`[NewHomeSidebar] 路由错误: ${url}`, err)

      // 如果是404错误，尝试恢复
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        console.log(`[NewHomeSidebar] 检测到404错误，尝试恢复到首页`)
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      }
    }

    const handleRouteChangeError = (err: any, url: string) => {
      console.error(`[NewHomeSidebar] 路由变化错误: ${url}`, err)
    }

    router.events.on('routeChangeError', handleRouteChangeError)

    return () => {
      router.events.off('routeChangeError', handleRouteChangeError)
    }
  }, [router])

  // 分组的菜单项
  const menuGroups = [
    {
      title: '主要功能',
      items: [
        {
          id: 'home',
          label: '首页',
          href: '/',
          icon: 'home',
          requireAuth: false
        },
        {
          id: 'search',
          label: '搜索内容',
          href: '/search',
          icon: 'search',
          requireAuth: false
        }
      ]
    },
    {
      title: '个人空间',
      items: [
        {
          id: 'dashboard',
          label: '个人中心',
          href: '/dashboard',
          icon: 'user',
          requireAuth: true
        },
        {
          id: 'create',
          label: '创建内容',
          href: '/dashboard/contents/create',
          icon: 'edit',
          requireAuth: true
        },
        {
          id: 'signin',
          label: '每日签到',
          href: '/dashboard/signin',
          icon: 'calendar',
          requireAuth: true
        }
      ]
    },
    {
      title: '社区内容',
      items: [
        {
          id: 'announcements',
          label: '公告',
          href: '/categories/announcements',
          icon: 'megaphone',
          requireAuth: false
        },
        {
          id: 'tutorials',
          label: '教程',
          href: '/categories/tutorials',
          icon: 'book',
          requireAuth: false
        },
        {
          id: 'guides',
          label: '说明文档',
          href: '/categories/guides',
          icon: 'document',
          requireAuth: false
        }
      ]
    }
  ]

  // 图标组件
  const IconComponent = ({ name, className = "h-5 w-5" }: { name: string; className?: string }) => {
    const icons: Record<string, JSX.Element> = {
      home: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      search: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      user: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      edit: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      calendar: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      megaphone: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      book: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      document: (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }

    return icons[name] || icons.home
  }

  const handleLinkClick = async (href: string) => {
    console.log(`[NewHomeSidebar] 链接被点击: ${href}`)
    console.log(`[NewHomeSidebar] 当前路径: ${router.pathname}`)
    console.log(`[NewHomeSidebar] 当前URL: ${window.location.href}`)

    try {
      // 检查是否是相同路径
      if (router.pathname === href) {
        console.log(`[NewHomeSidebar] 已在目标页面: ${href}`)
        onLinkClick?.()
        return
      }

      console.log(`[NewHomeSidebar] 开始导航到: ${href}`)

      // 添加导航前的状态检查
      console.log(`[NewHomeSidebar] 路由器状态:`, {
        isReady: router.isReady,
        isFallback: router.isFallback,
        pathname: router.pathname,
        asPath: router.asPath
      })

      // 使用Next.js路由进行导航，添加更多选项
      const success = await router.push(href, href, {
        shallow: false,
        scroll: true
      })

      console.log(`[NewHomeSidebar] 路由推送结果: ${success}`)

      if (success !== false) {
        console.log(`[NewHomeSidebar] ✅ 导航成功: ${href}`)
        console.log(`[NewHomeSidebar] 新路径: ${router.pathname}`)
        onLinkClick?.()
      } else {
        console.error(`[NewHomeSidebar] ❌ 导航返回false: ${href}`)
        // 尝试使用window.location作为备选方案
        console.log(`[NewHomeSidebar] 尝试使用window.location导航`)
        window.location.href = href
      }
    } catch (error: any) {
      console.error(`[NewHomeSidebar] ❌ 导航异常: ${href}`, error)
      console.error(`[NewHomeSidebar] 错误详情:`, {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type',
        cause: error?.cause || 'No cause'
      })

      // 检查是否是特定的路由错误
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        console.error(`[NewHomeSidebar] 页面不存在: ${href}`)
        alert(`页面不存在: ${href}`)
        return
      }

      // 尝试使用window.location作为备选方案
      console.log(`[NewHomeSidebar] 尝试使用window.location作为备选方案`)
      try {
        window.location.href = href
      } catch (fallbackError: any) {
        console.error(`[NewHomeSidebar] ❌ 备选方案也失败:`, fallbackError)
        alert(`导航失败: ${href}\n错误: ${error?.message || 'Unknown error'}`)
      }
    }
  }

  return (
    <div className={`h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        {/* Logo和切换按钮区域 */}
        <div className="mb-6 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={(e) => {
              e.preventDefault()
              handleLinkClick('/')
            }}
            className="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              兔
            </div>
            <span>兔图</span>
          </button>

          {/* 桌面端收起按钮 */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden lg:flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="收起侧边栏"
          >
            <span className="sr-only">收起侧边栏</span>
            <svg
              className="h-5 w-5"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">导航菜单</h2>
        </div>

        {/* 用户信息 */}
        {session && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.user.name || '用户'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="space-y-6">
          {menuGroups.map((group) => {
            // 检查该组是否有可显示的项目
            const visibleItems = group.items.filter(item => !item.requireAuth || session)

            if (visibleItems.length === 0) {
              return null
            }

            return (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    // 如果需要登录但用户未登录，则不显示
                    if (item.requireAuth && !session) {
                      return null
                    }

                    const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/')

                    return (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.preventDefault()
                          handleLinkClick(item.href)
                        }}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-lg
                          text-left transition-colors cursor-pointer
                          ${isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        <IconComponent name={item.icon} className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* 未登录用户的登录提示 */}
        {!session && (
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              登录后享受更多功能
            </p>
            <div className="space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleLinkClick('/auth/signin')
                }}
                className="block w-full px-3 py-2 text-sm font-medium text-center text-blue-600 hover:text-blue-500 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                登录
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleLinkClick('/auth/signup')
                }}
                className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                注册
              </button>
            </div>
          </div>
        )}

        {/* 主题切换器 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">主题设置</h3>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
