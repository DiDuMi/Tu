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

  // 导航链接配置 - 按分组组织
  const navGroups = [
    {
      title: '概览',
      links: [
        {
          href: '/admin',
          label: '控制台',
          icon: '📊',
          active: router.pathname === '/admin',
          showFor: () => true,
        },
      ]
    },
    {
      title: '用户管理',
      links: [
        {
          href: '/admin/users',
          label: '用户管理',
          icon: '👥',
          active: router.pathname.startsWith('/admin/users'),
          showFor: () => true,
        },
        {
          href: '/admin/user-groups',
          label: '用户组管理',
          icon: '🏷️',
          active: router.pathname.startsWith('/admin/user-groups'),
          showFor: () => isAdmin(session),
        },
      ]
    },
    {
      title: '内容管理',
      links: [
        {
          href: '/admin/content',
          label: '内容管理',
          icon: '📝',
          active: router.pathname === '/admin/content' || router.pathname === '/admin/content/',
          showFor: () => true,
        },
        {
          href: '/admin/content/categories',
          label: '分类管理',
          icon: '📂',
          active: router.pathname === '/admin/content/categories',
          showFor: () => true,
        },
        {
          href: '/admin/content/tags',
          label: '标签管理',
          icon: '🏷️',
          active: router.pathname === '/admin/content/tags',
          showFor: () => true,
        },
        {
          href: '/admin/content/review',
          label: '内容审核',
          icon: '✅',
          active: router.pathname === '/admin/content/review',
          showFor: () => true,
        },
      ]
    },
    {
      title: '评论管理',
      links: [
        {
          href: '/admin/comments/review',
          label: '评论审核',
          icon: '💬',
          active: router.pathname === '/admin/comments/review',
          showFor: () => true,
        },
      ]
    },
    {
      title: '媒体管理',
      links: [
        {
          href: '/admin/media',
          label: '媒体管理',
          icon: '🖼️',
          active: router.pathname === '/admin/media' || router.pathname === '/admin/media/',
          showFor: () => true,
        },
        {
          href: '/admin/media/compression-stats',
          label: '压缩统计',
          icon: '📈',
          active: router.pathname === '/admin/media/compression-stats',
          showFor: () => isAdmin(session),
        },
      ]
    },
    {
      title: '系统设置',
      links: [
        {
          href: '/admin/settings',
          label: '系统设置',
          icon: '⚙️',
          active: router.pathname === '/admin/settings',
          showFor: () => isAdmin(session),
        },
        {
          href: '/admin/settings/logs',
          label: '系统日志',
          icon: '📋',
          active: router.pathname === '/admin/settings/logs',
          showFor: () => isAdmin(session),
        },
        {
          href: '/admin/settings/backups',
          label: '系统备份',
          icon: '💾',
          active: router.pathname === '/admin/settings/backups',
          showFor: () => isAdmin(session),
        },
      ]
    },
  ]

  // 过滤出当前用户可见的分组和链接
  const visibleGroups = navGroups.map(group => ({
    ...group,
    links: group.links.filter(link => link.showFor())
  })).filter(group => group.links.length > 0)

  // 侧边栏导航渲染
  return (
    <nav className="space-y-6">
      {visibleGroups.map((group) => (
        <div key={group.title}>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {group.title}
          </h3>
          <div className="mt-2 space-y-1">
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  link.active
                    ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={onClick}
              >
                <span className="mr-3 text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
