import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useUserStore } from '@/stores/userStore'

interface ContentFavoriteButtonProps {
  contentId: string
  initialFavorited?: boolean
}

export default function ContentFavoriteButton({ contentId, initialFavorited = false }: ContentFavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isLoading, setIsLoading] = useState(false)
  const { favorites, addToFavorites, removeFromFavorites } = useUserStore()
  
  // 检查内容是否已收藏
  useEffect(() => {
    if (session && favorites.length > 0) {
      const favorited = favorites.some(item => item.uuid === contentId)
      setIsFavorited(favorited)
    } else {
      setIsFavorited(initialFavorited)
    }
  }, [session, favorites, contentId, initialFavorited])
  
  // 处理收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!session) {
      // 未登录，跳转到登录页面
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)
      return
    }
    
    setIsLoading(true)
    
    try {
      if (isFavorited) {
        // 取消收藏
        await removeFromFavorites(contentId)
        setIsFavorited(false)
      } else {
        // 添加收藏
        await addToFavorites(contentId)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`inline-flex flex-col items-center justify-center p-3 rounded-full transition-all ${
        isFavorited
          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isFavorited ? '取消收藏' : '收藏'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        fill={isFavorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isFavorited ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span className="mt-1 text-sm font-medium">
        {isFavorited ? '已收藏' : '收藏'}
      </span>
    </button>
  )
}
