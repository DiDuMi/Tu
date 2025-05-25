import Head from 'next/head'
import Link from 'next/link'

import MainLayout from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { SafeImage } from '@/components/ui/SafeImage'

export default function Custom404() {
  return (
    <MainLayout>
      <Head>
        <title>页面未找到 - 兔图</title>
        <meta name="description" content="页面未找到" />
      </Head>

      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-64 h-64 mb-8">
          <SafeImage
            src="/images/404-rabbit.svg"
            alt="404 - 页面未找到"
            fill
            className="object-contain"
            highPriority
            onError={(e) => {
              // 如果图片加载失败，显示备用内容
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">页面未找到</h1>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
          抱歉，您访问的页面不存在或已被移除。
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.history.back()}>
            返回上一页
          </Button>
          <Link href="/">
            <Button variant="outline">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
