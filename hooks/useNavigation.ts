import { useRouter } from 'next/router'

interface NavLink {
  href: string
  label: string
  exact: boolean
}

export function useNavigation() {
  const router = useRouter()

  // 导航链接配置
  const navLinks: NavLink[] = [
    { href: '/', label: '首页', exact: true },
    { href: '/search', label: '搜索内容', exact: false },
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

  return {
    navLinks,
    isActive,
    currentPath: router.pathname
  }
}

export type { NavLink }
