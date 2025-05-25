import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ContentLikeButtonProps {
  liked: boolean
  likeCount: number
  onLike: () => Promise<{ isLiked: boolean, likeCount: number }>
}

export default function ContentLikeButton({
  liked: initialLiked,
  likeCount: initialLikeCount,
  onLike,
}: ContentLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isAnimating, setIsAnimating] = useState(false)

  // 当props变化时更新状态
  useEffect(() => {
    setLiked(initialLiked)
    setLikeCount(initialLikeCount)
  }, [initialLiked, initialLikeCount])

  // 处理点赞
  const handleLike = async () => {
    // 乐观更新UI
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1)

    // 添加动画效果
    setIsAnimating(true)
    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)

    // 调用API
    try {
      const result = await onLike()
      // 使用API返回的实际状态和点赞数量更新UI
      setLiked(result.isLiked)
      setLikeCount(result.likeCount)
    } catch (error) {
      // 如果API调用失败，回滚UI状态
      console.error('点赞失败:', error)
      setLiked(wasLiked)
      setLikeCount(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1))
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="outline"
        size="lg"
        className={`rounded-full p-4 ${
          liked ? 'text-error-500 border-error-500 hover:bg-error-50' : 'text-gray-500 hover:text-error-500'
        } ${isAnimating ? 'animate-pulse' : ''}`}
        onClick={handleLike}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${isAnimating ? 'animate-heartbeat' : ''}`}
          fill={liked ? 'currentColor' : 'none'}
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
      </Button>
      <span className="mt-2 text-sm font-medium text-gray-700">
        {likeCount > 0 ? likeCount : '点赞'}
      </span>
    </div>
  )
}
