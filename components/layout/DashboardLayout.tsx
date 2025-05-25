import { ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({
  children,
  title = '个人中心 - 兔图',
}: DashboardLayoutProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // 导航链接
  const navLinks = [
    { href: '/dashboard', label: '概览', exact: true },
    { href: '/dashboard/contents', label: '我的内容' },
    { href: '/dashboard/templates', label: '模板管理' },
    { href: '/dashboard/favorites', label: '我的收藏' },
    { href: '/dashboard/likes', label: '我的点赞' },
    { href: '/dashboard/profile', label: '个人资料' },
  ]

  // 检查链接是否激活
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return router.pathname === href
    }
    return router.pathname.startsWith(href)
  }

  // 如果未登录，重定向到登录页面
  if (!isLoading && !session) {
    router.push('/auth/signin?callbackUrl=/dashboard')
    return null
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="兔图内容管理平台个人中心" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-xl font-bold text-primary-600">
                兔图
              </Link>

              <nav className="hidden md:flex space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(link.href, link.exact)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center space-x-4">
                <Link href="/dashboard/contents/create">
                  <Button size="sm">发布内容</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 移动端导航 */}
        <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full z-10">
          <div className="grid grid-cols-6 h-14">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center text-xs ${
                  isActive(link.href, link.exact)
                    ? 'text-primary-600'
                    : 'text-gray-500'
                }`}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 主要内容 */}
        <main className="pb-16 md:pb-0">{children}</main>

        {/* 页脚 */}
        <footer className="bg-white border-t border-gray-200 py-6 mt-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} 兔图内容管理平台. 保留所有权利.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
