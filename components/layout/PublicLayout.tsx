import { ReactNode } from 'react'

import { PageTransition } from '@/components/ui/PageTransition'
import { SkipLink } from '@/components/ui/AccessibilityComponents'

import SEOHead from './SEOHead'
import PublicHeader from './PublicHeader'
import MobileMenu from './MobileMenu'
import PublicFooter from './PublicFooter'

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* SEO头部 */}
      <SEOHead
        title={title}
        description={description}
        keywords={keywords}
        image={image}
      />

      {/* 跳过链接 */}
      <SkipLink href="#main-content">跳转到主要内容</SkipLink>
      <SkipLink href="#navigation">跳转到导航</SkipLink>

      {/* 顶部导航栏 */}
      {showHeader && <PublicHeader showSearch={showSearch} />}

      {/* 移动端菜单 */}
      <MobileMenu />

      {/* 主要内容 */}
      <main id="main-content" className="py-10">
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8`}>
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>

      {/* 页脚 */}
      {showFooter && <PublicFooter />}
    </div>
  )
}
