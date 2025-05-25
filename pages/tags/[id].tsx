import { useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Pagination } from '@/components/ui/Pagination'
import { fetcher } from '@/lib/api'
import MainLayout from '@/components/layout/MainLayout'
import ContentCard from '@/components/content/ContentCard'
import PublicContentFilter from '@/components/content/PublicContentFilter'

interface TagPageProps {
  initialTag: any
  initialContents: any
}

export default function TagPage({ initialTag, initialContents }: TagPageProps) {
  const router = useRouter()
  const { id } = router.query

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [filters, setFilters] = useState({
    category: '',
    tag: id as string,
    sort: 'newest',
  })

  // 使用SWR获取标签信息
  const { data: tagData, error: tagError } = useSWR(
    `/api/v1/tags/${id}`,
    fetcher,
    { fallbackData: initialTag }
  )

  const tag = tagData?.data

  // 构建查询参数
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: pageSize.toString(),
    ...filters,
  })

  // 使用SWR获取内容列表
  const { data: contentsData, error: contentsError, isLoading } = useSWR(
    `/api/v1/pages?${queryParams.toString()}`,
    fetcher,
    {
      fallbackData: initialContents,
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30秒内不重复请求
    }
  )

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 处理筛选条件变化
  const handleFilterChange = (newFilters: any) => {
    // 保持标签不变
    setFilters(prev => ({ ...prev, ...newFilters, tag: id as string }))
    setCurrentPage(1) // 重置页码
  }

  // 计算分页信息
  const pagination = contentsData?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  }

  // 如果标签不存在，显示错误页面
  if (tagError || !tag) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-4">
            标签不存在或已被删除
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => router.push('/')}>返回首页</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Head>
        <title>#{tag.name} - 兔图</title>
        <meta name="description" content={`浏览带有 #${tag.name} 标签的所有内容 - 兔图内容管理平台`} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Link href="/" className="text-gray-500 hover:text-primary-600">
              首页
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-900">标签</span>
            <span className="mx-2 text-gray-500">/</span>
            <span className="text-gray-900 font-medium">#{tag.name}</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">#{tag.name}</h1>
          {tag.description && (
            <p className="mt-2 text-gray-600">{tag.description}</p>
          )}
        </div>

        {/* 筛选器 */}
        <PublicContentFilter
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* 内容列表 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : contentsError ? (
          <div className="text-center py-20">
            <p className="text-error-500">加载内容失败，请稍后重试</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.reload()}
            >
              重新加载
            </Button>
          </div>
        ) : !contentsData?.data || !Array.isArray(contentsData.data) || contentsData.data.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">该标签下暂无内容</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {contentsData.data.map((content: any) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }

  try {
    // 构建API基础URL
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = context.req.headers.host || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // 在服务器端获取标签信息
    const tagResponse = await fetch(`${baseUrl}/api/v1/tags/${id}`)

    if (!tagResponse.ok) {
      return {
        notFound: true,
      }
    }

    const tagData = await tagResponse.json()

    // 获取该标签下的内容列表
    const contentsResponse = await fetch(
      `${baseUrl}/api/v1/pages?tag=${id}&page=1&limit=12&sort=newest`
    )
    const contentsData = await contentsResponse.json()

    return {
      props: {
        initialTag: tagData,
        initialContents: contentsData,
      },
    }
  } catch (error) {
    console.error('获取标签信息失败:', error)

    return {
      notFound: true,
    }
  }
}
