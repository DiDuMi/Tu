import Link from 'next/link'
import SafeImage from '@/components/ui/SafeImage'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { PageTitle } from '@/components/ui/PageTitle'
import { fetcher } from '@/lib/api'
import PublicLayout from '@/components/layout/PublicLayout'
import HomeSidebarLayout from '@/components/layout/HomeSidebarLayout'
import ContentCard from '@/components/content/ContentCard'
import { useUIStore } from '@/stores/uiStore'

export default function Home() {
  const { data: session } = useSession()
  const { homeLayoutMode } = useUIStore()

  // 获取精选内容 - 优先显示指定为首页精选的内容，其次显示featured内容
  const { data: featuredData } = useSWR(
    '/api/v1/pages?limit=5&sort=home_featured',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  // 获取近期流出 - 优先显示指定为首页近期流出的内容，其次显示最新内容
  const { data: latestData } = useSWR(
    '/api/v1/pages?limit=8&sort=home_latest',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  // 获取往期补档 - 优先显示指定为首页往期补档的内容
  const { data: archiveData } = useSWR(
    '/api/v1/pages?limit=4&sort=home_archive',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  // 获取热门推荐 - 优先显示指定为首页热门推荐的内容，其次显示热门内容
  const { data: trendingData } = useSWR(
    '/api/v1/pages?limit=4&sort=home_trending',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  // 获取分类列表
  const { data: categoriesData } = useSWR(
    '/api/v1/categories?limit=6',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟内不重复请求
    }
  )



  // 安全地获取数据
  const featuredContents = featuredData?.data?.items || []
  const latestContents = latestData?.data?.items || []
  const archiveContents = archiveData?.data?.items || []
  const trendingContents = trendingData?.data?.items || []
  const _categories = categoriesData?.data?.items || []

  // 根据布局模式选择不同的布局组件
  const LayoutComponent = homeLayoutMode === 'sidebar' ? HomeSidebarLayout : PublicLayout

  // 首页内容组件
  const HomeContent = () => (
    <>
      <PageTitle
        title="兔图内容平台"
        description="创作、分享、发现精彩内容"
        keywords={["内容平台", "知识分享", "创作社区"]}
      />



      {/* 英雄区域 */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <SafeImage
            src="/api/v1/placeholder-image"
            alt="背景图案"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              创作、分享、发现
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-3xl">
              兔图内容平台让您轻松创建、编辑和发布内容，连接志同道合的人，分享您的知识和见解。
            </p>
            <div className="mt-6 flex flex-row gap-3 sm:gap-4">
              {!session ? (
                <>
                  <Link href="/auth/signup" className="flex-1">
                    <Button size="lg" className="w-full bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 sm:px-8">
                      🚀 立即注册
                    </Button>
                  </Link>
                  <Link href="/search" className="flex-1">
                    <Button size="lg" className="w-full bg-white/10 text-white border-2 border-white/30 hover:bg-white hover:text-primary-600 transition-all duration-200 backdrop-blur-sm font-semibold px-4 sm:px-8">
                      🔍 浏览内容
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard/contents/create" className="flex-1">
                    <Button size="lg" className="w-full bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-4 sm:px-8">
                      ✨ 创建内容
                    </Button>
                  </Link>
                  <Link href="/search" className="flex-1">
                    <Button size="lg" className="w-full bg-white/10 text-white border-2 border-white/30 hover:bg-white hover:text-primary-600 transition-all duration-200 backdrop-blur-sm font-semibold px-4 sm:px-8">
                      🔍 浏览内容
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>





      {/* 精选内容 */}
      {featuredContents.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">精选内容</h2>
            <Link href="/search?sort=home_featured" className="text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90">
              查看更多 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {featuredContents.length > 0 && (
              <div className="lg:col-span-3">
                <Link href={`/pages/${featuredContents[0].uuid}`} className="block">
                  <div className="relative h-80 w-full rounded-xl overflow-hidden">
                    {featuredContents[0].coverImage ? (
                      <SafeImage
                        src={featuredContents[0].coverImage}
                        alt={featuredContents[0].title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-bold text-white">{featuredContents[0].title}</h3>
                      <p className="mt-2 text-sm text-white/80 line-clamp-2">{featuredContents[0].summary}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="lg:col-span-2 grid grid-cols-1 gap-6">
              {featuredContents.slice(1, 3).map((content: any) => (
                <Link key={content.id} href={`/pages/${content.uuid}`} className="block">
                  <div className="relative h-36 w-full rounded-xl overflow-hidden">
                    {content.coverImage ? (
                      <SafeImage
                        src={content.coverImage}
                        alt={content.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-base font-bold text-white">{content.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 近期流出 */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">近期流出</h2>
          <Link href="/search?sort=home_latest" className="text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90">
            查看更多 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestContents.slice(0, 8).map((content: any) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </div>

      {/* 往期补档 */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">往期补档</h2>
          <Link href="/search?sort=home_archive" className="text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90">
            查看更多 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {archiveContents.slice(0, 4).map((content: any) => (
            <div key={content.id} className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/pages/${content.uuid}`} className="flex flex-col md:flex-row">
                <div className="relative md:w-1/3 h-48 md:h-auto bg-gray-200">
                  {content.coverImage ? (
                    <SafeImage
                      src={content.coverImage}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-6 md:w-2/3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">{content.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted line-clamp-2">{content.summary}</p>
                  <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-dark-muted">
                    <div className="flex items-center mr-4">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{content.viewCount}</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{content.likeCount}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{content.commentCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 热门推荐 */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">热门推荐</h2>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">根据用户互动量自动推荐的热门内容</p>
          </div>
          <Link href="/search?sort=home_trending" className="text-primary-600 hover:text-primary-500 dark:text-dark-primary dark:hover:text-dark-primary/90">
            查看更多 &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingContents.slice(0, 3).map((content: any) => (
            <div key={`trending-${content.id}`} className="bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/pages/${content.uuid}`} className="block">
                <div className="relative aspect-video">
                  {content.coverImage ? (
                    <SafeImage
                      src={content.coverImage}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    热门
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text line-clamp-2">{content.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted line-clamp-2">{content.summary}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-dark-muted">
                      <svg className="h-4 w-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{content.likeCount || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-dark-muted">
                      {new Date(content.publishedAt || content.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 加入社区 */}
      <div className="mt-16 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-extrabold text-white">加入我们的内容创作社区</h2>
            <p className="mt-4 text-lg text-secondary-100">
              注册成为兔图内容平台的一员，创建和分享您的内容，与志同道合的创作者交流。
            </p>
            <div className="mt-8 flex space-x-4">
              {!session ? (
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-secondary-600 hover:bg-secondary-50">
                    立即注册
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-secondary-600 hover:bg-secondary-50">
                    进入控制台
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <LayoutComponent
      title="兔图内容平台 - 创作、分享、发现"
      description="兔图内容平台，提供自主可控的内容创建、编辑和发布功能，让创作更简单，分享更便捷"
      keywords={["内容平台", "知识分享", "创作社区"]}
    >
      <HomeContent />
    </LayoutComponent>
  )
}