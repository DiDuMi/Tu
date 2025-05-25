import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { ErrorWithRetry } from '@/components/ui/ErrorWithRetry'
import { PageTitle } from '@/components/ui/PageTitle'
import { ClientOnlyTime } from '@/components/ui/ClientOnlyTime'
import { fetcher } from '@/lib/api'
import { useUserStore } from '@/stores/userStore'
import PublicLayout from '@/components/layout/PublicLayout'
import CommentSection from '@/components/content/CommentSection'
import RelatedContents from '@/components/content/RelatedContents'
import ContentLikeButton from '@/components/content/ContentLikeButton'
import ContentFavoriteButton from '@/components/content/ContentFavoriteButton'
import ContentPreviewLimit from '@/components/content/ContentPreviewLimit'
import TagList from '@/components/content/TagList'
import VideoContentProcessor from '@/components/content/VideoContentProcessor'

interface ContentDetailProps {
  initialData: any
}

export default function ContentDetail({ initialData }: ContentDetailProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { id } = router.query
  const [liked, setLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  // 从用户状态获取收藏和点赞信息
  const { favorites, likedContents, toggleLike, fetchFavorites, fetchLikedContents } = useUserStore()

  // 使用SWR获取内容详情，使用初始数据作为fallback
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/pages/${id}` : null,
    fetcher,
    {
      fallbackData: initialData,
      revalidateOnFocus: true, // 窗口获得焦点时重新验证
      revalidateOnReconnect: true, // 重新连接时重新验证
      revalidateIfStale: true, // 数据过期时重新验证
      dedupingInterval: 60000, // 1分钟内不重复请求（减少缓存时间）
      refreshInterval: 120000, // 每2分钟自动刷新
      errorRetryCount: 3, // 错误重试3次
      errorRetryInterval: 5000, // 错误重试间隔5秒
      onError: (err) => {
        console.error(`内容获取错误: ${err.message}`, err)
      },
      onSuccess: (_data) => {
        console.log(`内容获取成功: ID=${id}`)
      }
    }
  )

  // 当用户登录状态变化时，获取收藏和点赞信息
  useEffect(() => {
    if (session) {
      fetchFavorites()
      fetchLikedContents()
    }
  }, [session, fetchFavorites, fetchLikedContents])

  // 检查内容是否已收藏
  useEffect(() => {
    if (session && favorites.length > 0 && id) {
      const favorited = favorites.some(item => item.uuid === id)
      setIsFavorited(favorited)
    }
  }, [session, favorites, id])

  // 检查内容是否已点赞
  useEffect(() => {
    if (session && likedContents.length > 0 && id) {
      const isLiked = likedContents.some(item => item.uuid === id)
      setLiked(isLiked)
    }
  }, [session, likedContents, id])

  // 处理API返回的数据，确保author字段存在
  const content = data?.data

  // 如果content存在但author不存在，将user字段映射为author
  if (content && !content.author && content.user) {
    content.author = {
      id: content.user.id,
      name: content.user.name,
      avatar: content.user.image
    }
  }

  // 处理图片加载错误
  const [imageError, setImageError] = useState(false)
  const handleImageError = () => {
    setImageError(true)
  }

  // 处理内容点赞
  const handleLike = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)
      return { isLiked: liked, likeCount: content?.likeCount || 0 }
    }

    try {
      const result = await toggleLike(id as string)
      setLiked(result.isLiked)

      // 更新内容数据，但不立即重新验证，因为我们已经更新了UI状态
      // 这样可以避免闪烁，同时确保后台数据最终会同步
      setTimeout(() => mutate(), 1000)

      return result
    } catch (error) {
      console.error('点赞失败:', error)
      return { isLiked: liked, likeCount: content?.likeCount || 0 } // 返回原始状态
    }
  }

  // 如果正在加载或出错，显示相应的UI
  if (isLoading && !initialData) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-500">正在加载内容，请稍候...</p>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (error) {
    console.error('内容加载错误:', error)
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <ErrorWithRetry
            title="内容加载失败"
            message={error?.message || '加载内容时发生错误，请稍后再试'}
            onRetry={() => mutate()}
            onBack={() => router.push('/')}
            retryText="重新加载"
            backText="返回首页"
          />
        </div>
      </PublicLayout>
    )
  }

  if (!data || !data.success || !content) {
    console.error('内容数据无效:', data)
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <ErrorWithRetry
            title="内容不存在"
            message="您请求的内容不存在或已被删除"
            showRetryButton={false}
            onBack={() => router.push('/')}
            backText="返回首页"
          />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout
      title={content.title}
      description={content.summary || content.title}
      image={content.coverImage}
      keywords={content.tags?.map((tag: any) => tag.name) || []}
    >
      <PageTitle
        title={content.title}
        description={content.summary || content.title}
        image={content.coverImage}
        keywords={content.tags?.map((tag: any) => tag.name)}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 面包屑导航 */}
          <nav className="flex mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">
              首页
            </Link>
            <span className="mx-2">/</span>
            {content.category && (
              <>
                <Link
                  href={`/categories/${content.category.slug}`}
                  className="hover:text-primary-600"
                >
                  {content.category.name}
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-700 truncate">{content.title}</span>
          </nav>

          {/* 内容标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>

          {/* 内容元信息 */}
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6">
            {content.author ? (
              <Link
                href={`/users/${content.author.id}`}
                className="flex items-center mr-4 hover:text-primary-600"
              >
                <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2">
                  {content.author.avatar ? (
                    <img
                      src={content.author.avatar}
                      alt={content.author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                      {content.author.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span>{content.author.name}</span>
              </Link>
            ) : (
              <span className="flex items-center mr-4 text-gray-500">
                <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                  <span>?</span>
                </div>
                <span>未知作者</span>
              </span>
            )}

            <ClientOnlyTime dateString={content.createdAt} className="mr-4" />

            <div className="flex items-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>{content.viewCount}</span>
            </div>

            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{content.commentCount}</span>
            </div>
          </div>

          {/* 封面图片 */}
          {content.coverImage && !imageError && (
            <div className="relative h-64 md:h-96 w-full mb-6 rounded-lg overflow-hidden">
              <img
                src={content.coverImage}
                alt={content.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          )}

          {/* 内容标签 */}
          {content.tags && content.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">标签</h3>
              <TagList
                tags={content.tags.map((tag: any) => ({
                  name: tag.name,
                  slug: tag.slug,
                  count: tag.useCount || 0
                }))}
              />
            </div>
          )}

          {/* 内容正文 */}
          <div className="prose prose-lg max-w-none mb-8 relative">
            <VideoContentProcessor
              content={content.content}
              hasVideoPermission={content.previewInfo?.hasVideoPermission !== false}
              className="prose-content"
            />

            {/* 预览限制提示 */}
            {content.previewInfo?.isLimited && (
              <ContentPreviewLimit
                previewPercentage={content.previewInfo.previewPercentage}
                className="mt-8"
              />
            )}

            {/* 视频权限限制提示 */}
            {content.previewInfo?.hasVideoRestriction && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-blue-700 text-sm">
                    此内容包含视频，您当前的用户组暂无播放权限。升级会员以观看完整视频内容。
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 互动按钮 */}
          <div className="flex justify-center gap-4 mb-8">
            <ContentLikeButton
              liked={liked || content.liked}
              likeCount={content.likeCount || 0}
              onLike={handleLike}
            />
            <ContentFavoriteButton
              contentId={content.uuid}
              initialFavorited={isFavorited}
            />
          </div>

          {/* 评论区 */}
          <CommentSection contentId={content.id} contentUuid={content.uuid} />

          {/* 相关内容 */}
          <RelatedContents contentId={content.id} categoryId={content.category?.id} />
        </div>
      </div>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }

  try {
    // 在服务器端获取内容详情
    // 使用绝对URL，但从请求头中获取主机信息
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const host = context.req.headers.host || 'localhost:3000'
    const apiUrl = `${protocol}://${host}/api/v1/pages/${id}`
    console.log(`Fetching content with ID: ${id} from ${apiUrl}`)

    // 添加请求头，包括cookie以传递认证信息
    const headers: HeadersInit = {
      'Cache-Control': 'no-cache'
    }

    // 如果有cookie，添加到请求头
    if (context.req.headers.cookie) {
      headers.cookie = context.req.headers.cookie
    }

    // 发送API请求
    let response
    try {
      response = await fetch(apiUrl, { headers })

      // 检查响应状态
      if (!response.ok) {
        console.error(`API响应错误: ${response.status} ${response.statusText}`)
        return { notFound: true }
      }

      // 尝试解析响应
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`API响应格式错误: ${contentType}`)
        return { notFound: true }
      }
    } catch (fetchError) {
      console.error(`API请求失败: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`, fetchError)
      return { notFound: true }
    }

    // 解析响应数据
    let data
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error(`JSON解析错误: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`, jsonError)
      return { notFound: true }
    }

    // 检查API响应是否成功
    if (!data.success) {
      console.error(`API返回错误: ${data.error?.message || '未知错误'}`)
      return { notFound: true }
    }

    return {
      props: {
        initialData: data,
      },
    }
  } catch (error) {
    console.error('获取内容详情失败:', error)
    return {
      notFound: true,
    }
  }
}
