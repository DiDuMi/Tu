import { ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useUIStore } from '@/stores/uiStore'
import SearchBar from '@/components/layout/SearchBar'
import SafeImage from '@/components/ui/SafeImage'
import ThemeSwitcher from '@/components/layout/ThemeSwitcher'
import UserDropdown from '@/components/layout/UserDropdown'
import LayoutSwitcher from '@/components/layout/LayoutSwitcher'
import { PageTransition } from '@/components/ui/PageTransition'
import { SkipLink } from '@/components/ui/AccessibilityComponents'

interface PublicLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  showHeader?: boolean
  showFooter?: boolean
  showSearch?: boolean
  fullWidth?: boolean
}

export default function PublicLayout({
  children,
  title = '兔图内容平台',
  description = '兔图内容平台，提供自主可控的内容创建、编辑和发布功能',
  keywords = [],
  image,
  showHeader = true,
  showFooter = true,
  showSearch = true,
  fullWidth = false,
}: PublicLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  // 导航链接
  const navLinks = [
    { href: '/', label: '首页', exact: true },
    { href: '/search', label: '搜索', exact: false },
    { href: '/pages', label: '内容库', exact: false },
    { href: '/media', label: '媒体库', exact: false },
    { href: '/categories/announcements', label: '公告', exact: false },
    { href: '/categories/tutorials', label: '教程', exact: false },
    { href: '/categories/guides', label: '说明', exact: false },
  ]

  // 检查链接是否激活
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return router.pathname === href
    }
    return router.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
        {image && <meta property="og:image" content={image} />}
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 跳过链接 */}
      <SkipLink href="#main-content">跳转到主要内容</SkipLink>
      <SkipLink href="#navigation">跳转到导航</SkipLink>

      {/* 顶部导航栏 */}
      {showHeader && (
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
      )}

      {/* 移动端菜单 */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} sm:hidden bg-white dark:bg-dark-card dark:border-b dark:border-dark-border`}>
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
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-muted dark:hover:text-dark-text dark:hover:bg-dark-border"
                >
                  个人资料
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

      {/* 主要内容 */}
      <main id="main-content" className="py-10">
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8`}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* 页脚 */}
      {showFooter && (
        <footer className="bg-white dark:bg-dark-card dark:border-t dark:border-dark-border">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted uppercase tracking-wider">关于我们</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted/80">
                  兔图内容平台致力于为用户提供高质量的内容创作和分享服务。
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted uppercase tracking-wider">快速链接</h3>
                <ul className="mt-2 space-y-2">
                  <li>
                    <Link href="/pages" className="text-sm text-gray-500 hover:text-gray-900 dark:text-dark-muted/80 dark:hover:text-dark-text">
                      浏览内容
                    </Link>
                  </li>
                  <li>
                    <Link href="/media" className="text-sm text-gray-500 hover:text-gray-900 dark:text-dark-muted/80 dark:hover:text-dark-text">
                      媒体库
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/contents/create" className="text-sm text-gray-500 hover:text-gray-900 dark:text-dark-muted/80 dark:hover:text-dark-text">
                      创建内容
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted uppercase tracking-wider">联系我们</h3>
                <ul className="mt-2 space-y-2">
                  <li className="text-sm text-gray-500 dark:text-dark-muted/80">
                    邮箱: contact@example.com
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 dark:border-dark-border pt-6">
              <p className="text-center text-sm text-gray-500 dark:text-dark-muted">
                &copy; {new Date().getFullYear()} 兔图内容平台. 保留所有权利.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
