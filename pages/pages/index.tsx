import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { fetcher } from '@/lib/api'
import PublicLayout from '@/components/layout/PublicLayout'
import { formatDate } from '@/lib/utils'

// 内容筛选组件
import { PublicContentFilter } from '@/components/content/PublicContentFilter'

export default function ContentListPage() {
  const router = useRouter()
  const { data: session } = useSession()

  // 筛选和分页状态
  const [filters, setFilters] = useState({
    categoryId: router.query.categoryId as string || '',
    tagId: router.query.tagId as string || '',
    keyword: router.query.keyword as string || '',
    page: parseInt(router.query.page as string || '1', 10),
  })

  // 处理筛选变化
  const handleFilterChange = (newFilters: any) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)

    // 更新URL查询参数
    const query: any = {}
    if (updatedFilters.categoryId) query.categoryId = updatedFilters.categoryId
    if (updatedFilters.tagId) query.tagId = updatedFilters.tagId
    if (updatedFilters.keyword) query.keyword = updatedFilters.keyword
    if (updatedFilters.page > 1) query.page = updatedFilters.page

    router.push({
      pathname: '/pages',
      query,
    }, undefined, { shallow: true })
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })

    // 更新URL查询参数
    const query: any = { ...router.query, page: page > 1 ? page : undefined }
    if (page === 1) delete query.page

    router.push({
      pathname: '/pages',
      query,
    }, undefined, { shallow: true })
  }

  // 获取内容列表
  const { data: contentsData, error } = useSWR(
    `/api/v1/pages?page=${filters.page}&limit=12${
      filters.categoryId ? `&categoryId=${filters.categoryId}` : ''
    }${filters.tagId ? `&tagId=${filters.tagId}` : ''}${
      filters.keyword ? `&keyword=${encodeURIComponent(filters.keyword)}` : ''
    }`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  const contents = contentsData?.data?.items || []
  const totalItems = contentsData?.data?.pagination?.total || 0
  const totalPages = contentsData?.data?.pagination?.totalPages || 1

  // 同步URL查询参数和状态
  useEffect(() => {
    const page = parseInt(router.query.page as string || '1', 10)
    const categoryId = router.query.categoryId as string || ''
    const tagId = router.query.tagId as string || ''
    const keyword = router.query.keyword as string || ''

    if (
      page !== filters.page ||
      categoryId !== filters.categoryId ||
      tagId !== filters.tagId ||
      keyword !== filters.keyword
    ) {
      setFilters({
        page,
        categoryId,
        tagId,
        keyword,
      })
    }
  }, [router.query])

  return (
    <PublicLayout
      title="内容库 - 兔图内容平台"
      description="浏览兔图内容平台上的精彩内容，按分类和标签查找"
      keywords={["内容库", "内容分类", "内容归档", "知识分享"]}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">内容库</h1>
            <p className="mt-1 text-gray-500 dark:text-dark-muted">按分类和标签浏览所有内容</p>
          </div>

          <div className="mt-4 md:mt-0">
            {!session ? (
              <Link href="/auth/signin">
                <Button>登录发布内容</Button>
              </Link>
            ) : (
              <Link href="/dashboard/contents/create">
                <Button>发布新内容</Button>
              </Link>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <PublicContentFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          showKeywordSearch={true}
        />

        {/* 内容列表 */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">加载内容时出错</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.reload()}
            >
              重试
            </Button>
          </div>
        ) : !contentsData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">加载内容中...</p>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content: any) => (
              <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/pages/${content.uuid}`}>
                  <div className="relative h-48 w-full bg-gray-100">
                    {content.coverImage ? (
                      <Image
                        src={content.coverImage}
                        alt={content.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {content.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                      {content.excerpt || '暂无摘要'}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative h-6 w-6 rounded-full overflow-hidden">
                          {content.user?.image ? (
                            <Image
                              src={content.user.image}
                              alt={content.user.name || '用户头像'}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                              {content.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          {content.user?.name || '匿名用户'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(content.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="mr-3">{content.viewCount || 0} 浏览</span>
                      <span className="mr-3">{content._count?.likes || 0} 点赞</span>
                      <span>{content._count?.comments || 0} 评论</span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取会话信息，但不强制登录
  const session = await getServerSession(context.req, context.res, authOptions)

  return {
    props: {},
  }
}
