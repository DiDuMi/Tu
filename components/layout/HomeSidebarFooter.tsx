import Link from 'next/link'

import { useUIStore } from '@/stores/uiStore'

interface HomeSidebarFooterProps {
  showFooter?: boolean
}

export default function HomeSidebarFooter({ showFooter = true }: HomeSidebarFooterProps) {
  const { homeSidebarExpanded } = useUIStore()

  if (!showFooter) {
    return null
  }

  return (
    <footer className={`bg-white dark:bg-dark-card dark:border-t dark:border-dark-border transition-all duration-300 ${
      homeSidebarExpanded ? 'lg:ml-80' : 'lg:ml-20'
    }`}>
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
                <Link href="/search" className="text-sm text-gray-500 hover:text-gray-900 dark:text-dark-muted/80 dark:hover:text-dark-text">
                  搜索内容
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
  )
}

export type { HomeSidebarFooterProps }
