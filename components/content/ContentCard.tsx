import { useState } from 'react'
import Link from 'next/link'
import { ClientOnlyTime } from '@/components/ui/ClientOnlyTime'
import { RippleCard } from '@/components/ui/RippleEffect'
import { LazyAvatar } from '@/components/ui/LazyImage'

interface ContentCardProps {
  content: {
    id: number
    uuid: string
    title: string
    summary?: string
    coverImage?: string
    author: {
      id: number
      name: string
      avatar?: string
    }
    category?: {
      id: number
      name: string
      slug: string
    }
    tags?: Array<{
      id: number
      name: string
      slug: string
    }>
    viewCount: number
    likeCount: number
    commentCount: number
    createdAt: string
    updatedAt: string
  }
  showLikeButton?: boolean
  initialLiked?: boolean
  onUnlike?: (contentId: string) => Promise<void>
}

export default function ContentCard({
  content,
  showLikeButton = false,
  initialLiked = false,
  onUnlike
}: ContentCardProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(content.likeCount || 0)

  // 处理取消点赞
  const handleUnlike = async () => {
    if (onUnlike) {
      try {
        // 乐观更新UI
        setLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))

        // 调用API
        await onUnlike(content.uuid)
      } catch (error) {
        // 如果失败，回滚UI
        console.error('取消点赞失败:', error)
        setLiked(true)
        setLikeCount(prev => prev + 1)
      }
    }
  }

  return (
    <RippleCard className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary-200 dark:hover:border-dark-primary/30 hover:-translate-y-1 group">
      <Link href={`/pages/${content.uuid}`} className="block">
        <div className="relative h-48 w-full overflow-hidden">
          {content.coverImage ? (
            <img
              src={content.coverImage}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-border dark:to-dark-bg text-gray-400 dark:text-dark-muted">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs opacity-75">暂无封面</span>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          {content.category && (
            <Link
              href={`/categories/${content.category.slug}`}
              className="inline-flex items-center text-xs font-medium text-primary-600 dark:text-dark-primary bg-primary-50 dark:bg-dark-primary/10 px-2.5 py-1 rounded-full hover:bg-primary-100 dark:hover:bg-dark-primary/20 transition-colors"
            >
              {content.category.name}
            </Link>
          )}
          <ClientOnlyTime
            dateString={content.createdAt}
            className="text-xs text-gray-500 dark:text-dark-muted"
          />
        </div>

        <Link href={`/pages/${content.uuid}`} className="block group">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-dark-primary transition-colors">
            {content.title}
          </h3>
        </Link>

        {content.summary && (
          <p className="text-sm text-gray-600 dark:text-dark-muted mb-4 line-clamp-2 leading-relaxed">{content.summary}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
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
            {showLikeButton ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleUnlike()
                }}
                className={`flex items-center mr-4 ${liked ? 'text-error-500' : 'text-gray-500'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill={liked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={liked ? 0 : 2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{likeCount}</span>
              </button>
            ) : (
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{likeCount}</span>
              </div>
            )}
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

          <Link
            href={`/users/${content.author.id}`}
            className="flex items-center text-gray-700 hover:text-primary-600"
          >
            <LazyAvatar
              src={content.author.avatar}
              alt={content.author.name}
              size={20}
              className="mr-1"
            />
            <span>{content.author.name}</span>
          </Link>
        </div>
      </div>
    </RippleCard>
  )
}
