import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

interface ContentItem {
  id: number
  uuid: string
  title: string
  excerpt: string | null
  featured: boolean
  viewCount: number
  likeCount: number
  createdAt: string
  category: {
    id: number
    name: string
    slug: string
  } | null
  user: {
    id: number
    name: string
  }
}

interface CategoryData {
  items: ContentItem[]
  total: number
}

export default function HomePreview() {
  const [featuredData, setFeaturedData] = useState<CategoryData | null>(null)
  const [latestData, setLatestData] = useState<CategoryData | null>(null)
  const [archiveData, setArchiveData] = useState<CategoryData | null>(null)
  const [trendingData, setTrendingData] = useState<CategoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategoryData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [featuredRes, latestRes, archiveRes, trendingRes] = await Promise.all([
        fetch('/api/v1/pages?sort=home_featured&limit=5'),
        fetch('/api/v1/pages?sort=home_latest&limit=8'),
        fetch('/api/v1/pages?sort=home_archive&limit=4'),
        fetch('/api/v1/pages?sort=home_trending&limit=4'),
      ])

      const [featured, latest, archive, trending] = await Promise.all([
        featuredRes.json(),
        latestRes.json(),
        archiveRes.json(),
        trendingRes.json(),
      ])

      if (featured.success) setFeaturedData(featured.data)
      if (latest.success) setLatestData(latest.data)
      if (archive.success) setArchiveData(archive.data)
      if (trending.success) setTrendingData(trending.data)

    } catch (error) {
      setError('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategoryData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const ContentCard = ({ item }: { item: ContentItem }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {item.excerpt}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>作者: {item.user.name}</span>
            <span>浏览: {item.viewCount}</span>
            <span>点赞: {item.likeCount}</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end space-y-1">
          {item.featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              精选
            </span>
          )}
          {item.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {item.category.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <AdminLayout title="首页预览 - 兔图管理后台">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">首页分类预览</h1>
            <p className="text-gray-600 mt-1">
              预览首页各分类的内容展示效果
            </p>
          </div>
          <Button onClick={fetchCategoryData} disabled={loading}>
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 精选推荐 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>精选推荐</span>
                <span className="text-sm font-normal text-gray-500">
                  {featuredData?.items.length || 0} / {featuredData?.total || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : featuredData?.items.length ? (
                <div className="space-y-3">
                  {featuredData.items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">暂无精选推荐</p>
                  <p className="text-xs text-gray-400 mt-1">
                    请将内容分类设置为"精选推荐"或标记为精选
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 近期流出 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>近期流出</span>
                <span className="text-sm font-normal text-gray-500">
                  {latestData?.items.length || 0} / {latestData?.total || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : latestData?.items.length ? (
                <div className="space-y-3">
                  {latestData.items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">暂无近期内容</p>
                  <p className="text-xs text-gray-400 mt-1">
                    请将内容分类设置为"近期流出"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 往期补档 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>往期补档</span>
                <span className="text-sm font-normal text-gray-500">
                  {archiveData?.items.length || 0} / {archiveData?.total || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : archiveData?.items.length ? (
                <div className="space-y-3">
                  {archiveData.items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">暂无往期内容</p>
                  <p className="text-xs text-gray-400 mt-1">
                    请将内容分类设置为"往期补档"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 热门推荐 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>热门推荐</span>
                <span className="text-sm font-normal text-gray-500">
                  {trendingData?.items.length || 0} / {trendingData?.total || 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : trendingData?.items.length ? (
                <div className="space-y-3">
                  {trendingData.items.map((item) => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">暂无热门内容</p>
                  <p className="text-xs text-gray-400 mt-1">
                    请将内容分类设置为"热门推荐"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>如何设置首页分类内容：</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>在创建或编辑内容时，选择对应的分类：</li>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong>精选推荐</strong>：选择"精选推荐"分类或勾选"设为精选推荐"</li>
                  <li><strong>近期流出</strong>：选择"近期流出"分类</li>
                  <li><strong>往期补档</strong>：选择"往期补档"分类</li>
                  <li><strong>热门推荐</strong>：选择"热门推荐"分类</li>
                </ul>
                <li>发布内容后，将自动显示在首页对应区域</li>
                <li>可以通过此页面预览效果，确保内容正确显示</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
