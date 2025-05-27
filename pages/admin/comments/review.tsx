import { useState } from 'react'

import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import useSWR from 'swr'

import { fetcher } from '@/lib/api'

import CommentBatchActions from '@/components/admin/CommentBatchActions'
import CommentFilters from '@/components/admin/CommentFilters'
import CommentItem from '@/components/admin/CommentItem'
import CommentPagination from '@/components/admin/CommentPagination'
import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'

import { authOptions } from '@/pages/api/auth/[...nextauth]'

interface Comment {
  id: number
  uuid: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isAnonymous: boolean
  nickname?: string
  email?: string
  guestId?: string
  createdAt: string
  reviewedAt?: string
  reviewNote?: string
  user?: {
    id: number
    name: string
    email: string
    image?: string
    isAdmin: boolean
  }
  page: {
    id: number
    uuid: string
    title: string
  }
  reviewer?: {
    id: number
    name: string
  }
}

interface CommentReviewPageProps {
  user: {
    id: string
    name: string
    role: string
  }
}

export default function CommentReviewPage({ user }: CommentReviewPageProps) {
  const [selectedComments, setSelectedComments] = useState<number[]>([])
  const [qualityComments, setQualityComments] = useState<number[]>([])
  const [reviewNote, setReviewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')

  // 获取评论列表
  const { data, error: fetchError, mutate } = useSWR(
    `/api/v1/admin/comments/review?page=${currentPage}&limit=20&status=${statusFilter}&search=${searchQuery}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const comments: Comment[] = data?.data?.items || []
  const pagination = data?.data?.pagination

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([])
    } else {
      setSelectedComments(comments.map(comment => comment.id))
    }
  }

  // 选择/取消选择评论
  const handleSelectComment = (commentId: number) => {
    setSelectedComments(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    )
  }

  // 标记/取消标记优质评论
  const handleToggleQuality = (commentId: number) => {
    setQualityComments(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    )
  }

  // 批量审核评论
  const handleBatchReview = async (action: 'approve' | 'reject') => {
    if (selectedComments.length === 0) {
      setError('请选择要审核的评论')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/v1/admin/comments/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentIds: selectedComments,
          action,
          reviewNote: reviewNote || undefined,
          qualityCommentIds: action === 'approve' ? qualityComments.filter(id => selectedComments.includes(id)) : [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '审核失败')
      }

      const result = await response.json()
      setSuccess(result.message)
      setSelectedComments([])
      setQualityComments([])
      setReviewNote('')
      mutate()
    } catch (error: any) {
      console.error('审核评论失败:', error)
      setError(error.message || '审核失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">评论审核</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理和审核用户评论，批准或拒绝待审核的评论
          </p>
        </div>

        {/* 筛选和搜索 */}
        <CommentFilters
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onStatusChange={(status) => {
            setStatusFilter(status)
            setCurrentPage(1)
          }}
          onSearchChange={setSearchQuery}
        />

        {/* 批量操作 */}
        <CommentBatchActions
          selectedCount={selectedComments.length}
          qualityCount={qualityComments.filter(id => selectedComments.includes(id)).length}
          reviewNote={reviewNote}
          isSubmitting={isSubmitting}
          onReviewNoteChange={setReviewNote}
          onBatchApprove={() => handleBatchReview('approve')}
          onBatchReject={() => handleBatchReview('reject')}
        />

        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="border-green-200 bg-green-50 text-green-800">
            {success}
          </Alert>
        )}

        {/* 评论列表 */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                评论列表 {pagination && `(${pagination.total} 条)`}
              </h2>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={comments.length > 0 && selectedComments.length === comments.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">全选</label>
              </div>
            </div>
          </div>

          {fetchError ? (
            <div className="p-4">
              <Alert variant="destructive">
                加载评论失败，请稍后重试
              </Alert>
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无评论数据
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedComments.includes(comment.id)}
                  isQuality={qualityComments.includes(comment.id)}
                  onSelect={handleSelectComment}
                  onToggleQuality={handleToggleQuality}
                />
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {pagination && (
          <CommentPagination
            pagination={pagination}
            onPageChange={setCurrentPage}
          />
        )}
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
    props: {
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
    },
  }
}
