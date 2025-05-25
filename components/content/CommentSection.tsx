import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ClientOnlyTime } from '@/components/ui/ClientOnlyTime'
import { fetcher } from '@/lib/api'

interface CommentSectionProps {
  contentId: number
  contentUuid: string
}

export default function CommentSection({ contentId, contentUuid }: CommentSectionProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 使用SWR获取评论列表
  const { data, error: fetchError, mutate } = useSWR(
    `/api/v1/pages/${contentUuid}/comments`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30秒内不重复请求
    }
  )

  const comments = data?.data || []

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)
      return
    }

    if (!commentText.trim()) {
      setError('评论内容不能为空')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/v1/pages/${contentUuid}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: commentText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '提交评论失败')
      }

      // 清空评论框并刷新评论列表
      setCommentText('')
      mutate()
    } catch (error: any) {
      console.error('提交评论失败:', error)
      setError(error.message || '提交评论失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">评论 ({comments.length})</h3>

      {/* 评论表单 */}
      <div className="mb-8">
        {session ? (
          <form onSubmit={handleSubmitComment}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || '用户头像'}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                  <textarea
                    rows={3}
                    name="comment"
                    id="comment"
                    className="block w-full py-3 px-4 border-0 resize-none focus:ring-0 focus:outline-none sm:text-sm"
                    placeholder="写下你的评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                  ></textarea>

                  <div className="py-2 px-4 bg-gray-50 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      支持Markdown格式
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      发表评论
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-2">
                    {error}
                  </Alert>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-2">登录后才能发表评论</p>
            <Button
              onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)}
            >
              去登录
            </Button>
          </div>
        )}
      </div>

      {/* 评论列表 */}
      {fetchError ? (
        <Alert variant="destructive" className="mb-4">
          加载评论失败，请稍后重试
        </Alert>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">暂无评论，快来发表第一条评论吧！</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment: any) => (
            <li key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                    {comment.user.avatar ? (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">{comment.user.name}</p>
                    {comment.user.isAdmin && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        管理员
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <ClientOnlyTime dateString={comment.createdAt} />
                    {session && (
                      <button
                        type="button"
                        className="ml-4 text-gray-500 hover:text-primary-600"
                        onClick={() => setCommentText(`@${comment.user.name} `)}
                      >
                        回复
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
