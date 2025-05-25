import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/api'

interface RelatedContentsProps {
  contentId: number
  categoryId?: number
}

export default function RelatedContents({ contentId, categoryId }: RelatedContentsProps) {
  // 构建查询参数
  const queryParams = new URLSearchParams({
    excludeId: contentId.toString(),
    limit: '4',
    ...(categoryId ? { categoryId: categoryId.toString() } : {})
  })

  // 使用SWR获取相关内容
  const { data, error, isLoading } = useSWR(
    `/api/v1/pages/related?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
    }
  )

  const relatedContents = data?.data || []

  // 处理图片加载错误
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  if (isLoading) {
    return (
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">相关内容</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-100 animate-pulse h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || relatedContents.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-gray-900 mb-6">相关内容</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relatedContents.map((content: any) => (
          <Link
            key={content.id}
            href={`/pages/${content.uuid}`}
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="relative h-16 w-16 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
              {content.coverImage && !imageErrors[content.id] ? (
                <img
                  src={content.coverImage}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(content.id)}
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                {content.title}
              </h4>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span className="truncate">{content.author.name}</span>
                <span className="mx-1">•</span>
                <span>{content.viewCount} 浏览</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
