import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ClientOnlyTime } from '@/components/ui/ClientOnlyTime'
import { fetcher } from '@/lib/api'
import { getOrCreateGuestId, getCurrentGuestId } from '@/lib/guestIdentity'

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
  const [guestId, setGuestId] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')

  // 初始化游客ID
  useEffect(() => {
    if (!session) {
      const currentGuestId = getCurrentGuestId()
      if (currentGuestId) {
        setGuestId(currentGuestId)
      } else {
        const newGuestId = getOrCreateGuestId()
        setGuestId(newGuestId)
      }
    }
  }, [session])

  // 使用SWR获取评论列表，包含游客ID
  const { data, error: fetchError, mutate } = useSWR(
    guestId || session ? `/api/v1/pages/${contentUuid}/comments?guestId=${guestId || ''}` : null,
    (url) => {
      // 添加游客ID到请求头
      return fetch(url, {
        headers: {
          'X-Guest-Id': guestId || '',
        },
      }).then(res => res.json())
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30秒内不重复请求
    }
  )

  const comments = data?.data || []

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentText.trim()) {
      setError('评论内容不能为空')
      return
    }

    // 游客评论需要昵称
    if (!session && !nickname.trim()) {
      setError('游客评论需要提供昵称')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const requestBody: any = {
        content: commentText,
      }

      // 如果是游客，添加游客信息
      if (!session) {
        requestBody.isAnonymous = true
        requestBody.nickname = nickname
        // 只在邮箱不为空时添加邮箱字段
        if (email && email.trim()) {
          requestBody.email = email.trim()
        }
        requestBody.guestId = guestId
      }

      const response = await fetch(`/api/v1/pages/${contentUuid}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Id': guestId || '',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '提交评论失败')
      }

      const result = await response.json()

      // 如果是游客且返回了新的guestId，更新本地guestId
      if (!session && result.data?.guestId) {
        setGuestId(result.data.guestId)
      }

      // 清空评论框并刷新评论列表
      setCommentText('')
      if (!session) {
        setNickname('')
        setEmail('')
      }
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
        <form onSubmit={handleSubmitComment}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                {session?.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || '用户头像'}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                    {session?.user.name?.charAt(0).toUpperCase() || (nickname ? nickname.charAt(0).toUpperCase() : '?')}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              {/* 游客信息输入 */}
              {!session && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                      昵称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="请输入昵称"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱 <span className="text-gray-400">(可选)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

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
                    {session ? '支持Markdown格式' : '游客评论需要审核后才能显示'}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!session && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`)}
                      >
                        登录
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      发表评论
                    </Button>
                  </div>
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
            <li key={comment.id} className={`bg-white p-4 rounded-lg border ${
              comment.status === 'PENDING' ? 'border-yellow-200 bg-yellow-50' :
              comment.status === 'REJECTED' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}>
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                    {comment.user?.image ? (
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name || comment.nickname || '用户头像'}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                        {(comment.user?.name || comment.nickname || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <p className="font-medium text-gray-900">
                      {comment.user?.name || comment.nickname || '匿名用户'}
                    </p>
                    {comment.user?.isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        管理员
                      </span>
                    )}
                    {comment.isAnonymous && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        游客
                      </span>
                    )}
                    {comment.status === 'PENDING' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        待审核
                      </span>
                    )}
                    {comment.status === 'REJECTED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        已拒绝
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                  {comment.status === 'PENDING' && (
                    <div className="mt-2 text-xs text-yellow-600">
                      此评论正在等待审核，审核通过后将对所有用户可见
                    </div>
                  )}
                  {comment.status === 'REJECTED' && comment.reviewNote && (
                    <div className="mt-2 text-xs text-red-600">
                      审核未通过：{comment.reviewNote}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <ClientOnlyTime dateString={comment.createdAt} />
                    {session && comment.status === 'APPROVED' && (
                      <button
                        type="button"
                        className="ml-4 text-gray-500 hover:text-primary-600"
                        onClick={() => setCommentText(`@${comment.user?.name || comment.nickname} `)}
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
