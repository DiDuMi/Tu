import Link from 'next/link'
import { useRouter } from 'next/router'
import { Session } from 'next-auth'
import { isAdmin } from '@/lib/permissions'

interface AdminNavLinksProps {
  session: Session
  mobile?: boolean
  onClick?: () => void
}

export default function AdminNavLinks({ session, mobile = false, onClick }: AdminNavLinksProps) {
  const router = useRouter()

  // 导航链接配置
  const navLinks = [
    {
      href: '/admin',
      label: '控制台',
      active: router.pathname === '/admin',
      showFor: () => true,
    },
    {
      href: '/admin/users',
      label: '用户管理',
      active: router.pathname.startsWith('/admin/users'),
      showFor: () => true,
    },
    {
      href: '/admin/user-groups',
      label: '用户组管理',
      active: router.pathname.startsWith('/admin/user-groups'),
      showFor: () => isAdmin(session),
    },
    {
      href: '/admin/content',
      label: '内容管理',
      active: router.pathname.startsWith('/admin/content'),
      showFor: () => true,
    },
    {
      href: '/admin/content/categories',
      label: '分类管理',
      active: router.pathname === '/admin/content/categories',
      showFor: () => true,
    },
    {
      href: '/admin/content/tags',
      label: '标签管理',
      active: router.pathname === '/admin/content/tags',
      showFor: () => true,
    },
    {
      href: '/admin/content/review',
      label: '内容审核',
      active: router.pathname === '/admin/content/review',
      showFor: () => true,
    },
    {
      href: '/admin/media',
      label: '媒体管理',
      active: router.pathname.startsWith('/admin/media'),
      showFor: () => true,
    },
    {
      href: '/admin/settings',
      label: '系统设置',
      active: router.pathname === '/admin/settings',
      showFor: () => isAdmin(session),
    },
    {
      href: '/admin/settings/logs',
      label: '系统日志',
      active: router.pathname === '/admin/settings/logs',
      showFor: () => isAdmin(session),
    },
    {
      href: '/admin/settings/backups',
      label: '系统备份',
      active: router.pathname === '/admin/settings/backups',
      showFor: () => isAdmin(session),
    },
  ]

  // 过滤出当前用户可见的链接
  const visibleLinks = navLinks.filter(link => link.showFor())

  if (mobile) {
    return (
      <div className="pt-2 pb-3 space-y-1">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              link.active
                ? 'border-primary-500 text-primary-700 bg-primary-50'
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
            }`}
            onClick={onClick}
          >
            {link.label}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      {visibleLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
            link.active
              ? 'border-primary-500 text-gray-900'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
