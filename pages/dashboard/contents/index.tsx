import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { fetcher } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'

// 内容状态标签组件
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: '草稿',
      className: 'bg-gray-100 text-gray-800',
    },
    PENDING: {
      label: '待审核',
      className: 'bg-yellow-100 text-yellow-800',
    },
    REVIEW: {
      label: '待审核',
      className: 'bg-yellow-100 text-yellow-800',
    },
    PUBLISHED: {
      label: '已发布',
      className: 'bg-green-100 text-green-800',
    },
    REJECTED: {
      label: '已拒绝',
      className: 'bg-red-100 text-red-800',
    },
    ARCHIVED: {
      label: '已归档',
      className: 'bg-blue-100 text-blue-800',
    },
  }

  const { label, className } = statusMap[status] || {
    label: '未知',
    className: 'bg-gray-100 text-gray-800',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

export default function UserContents() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // 分页和筛选状态
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // 状态更新对话框状态
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)

  // 获取用户内容列表
  const { data: contentsData, mutate } = useSWR(
    session ? `/api/v1/users/me/contents?page=${page}&limit=10${statusFilter ? `&status=${statusFilter}` : ''}` : null,
    fetcher
  )

  const contents = contentsData?.data?.items || []
  const totalItems = contentsData?.data?.totalItems || 0
  const totalPages = contentsData?.data?.totalPages || 1

  // 处理分页变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  // 处理状态筛选变化
  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status)
    setPage(1) // 重置到第一页
  }

  // 处理内容删除
  const handleDeleteContent = async (id: number) => {
    if (!confirm('确定要删除这个内容吗？此操作不可恢复。')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/pages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 刷新内容列表
        mutate()
        alert('内容已成功删除')
      } else {
        alert('删除内容失败')
      }
    } catch (error) {
      console.error('删除内容时出错:', error)
      alert('删除内容时发生错误')
    }
  }

  // 处理内容状态更新
  const handleStatusUpdate = async (id: number, newStatus: string) => {
    // 如果是拒绝状态，打开拒绝对话框
    if (newStatus === 'REJECTED') {
      setSelectedContentId(id)
      setIsRejectDialogOpen(true)
      return
    }

    setIsStatusUpdating(true)

    try {
      const response = await fetch(`/api/v1/pages/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // 刷新内容列表
        mutate()
        alert(`内容状态已更新为${getStatusLabel(newStatus)}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error?.message || '更新内容状态失败')
      }
    } catch (error) {
      console.error('更新内容状态时出错:', error)
      alert('更新内容状态时发生错误')
    } finally {
      setIsStatusUpdating(false)
    }
  }

  // 处理拒绝提交
  const handleRejectSubmit = async () => {
    if (!selectedContentId) return

    setIsStatusUpdating(true)

    try {
      const response = await fetch(`/api/v1/pages/${selectedContentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          reason: rejectReason
        }),
      })

      if (response.ok) {
        // 刷新内容列表
        mutate()
        setIsRejectDialogOpen(false)
        setRejectReason('')
        setSelectedContentId(null)
        alert('内容已拒绝')
      } else {
        const errorData = await response.json()
        alert(errorData.error?.message || '拒绝内容失败')
      }
    } catch (error) {
      console.error('拒绝内容时出错:', error)
      alert('拒绝内容时发生错误')
    } finally {
      setIsStatusUpdating(false)
    }
  }

  // 获取状态标签
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': '草稿',
      'REVIEW': '待审核',
      'PUBLISHED': '已发布',
      'REJECTED': '已拒绝',
      'ARCHIVED': '已归档'
    }
    return statusMap[status] || status
  }

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin?callbackUrl=/dashboard/contents')
    }
  }, [session, isLoading, router])

  if (isLoading || !session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <DashboardLayout title="我的内容 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的内容</h1>
          <Link href="/dashboard/contents/create">
            <Button>发布新内容</Button>
          </Link>
        </div>

        {/* 状态筛选 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange(null)}
            >
              全部
            </Button>
            <Button
              variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('DRAFT')}
            >
              草稿
            </Button>
            <Button
              variant={statusFilter === 'REVIEW' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('REVIEW')}
            >
              待审核
            </Button>
            <Button
              variant={statusFilter === 'PUBLISHED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('PUBLISHED')}
            >
              已发布
            </Button>
            <Button
              variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('REJECTED')}
            >
              已拒绝
            </Button>
            <Button
              variant={statusFilter === 'ARCHIVED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusFilterChange('ARCHIVED')}
            >
              已归档
            </Button>
          </div>
        </div>

        {/* 内容列表 */}
        <Card>
          <CardContent className="p-0">
            {contents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">暂无内容</p>
                <Link href="/dashboard/contents/create">
                  <Button>发布新内容</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览/点赞</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.map((content: any) => (
                      <tr key={content.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {content.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={content.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {content.publishedAt
                              ? new Date(content.publishedAt).toLocaleDateString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {content.viewCount} / {content.likeCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <a href={`/pages/${content.uuid}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">查看</Button>
                            </a>

                            {/* 状态操作按钮 */}
                            {content.status === 'DRAFT' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(content.id, 'REVIEW')}
                                disabled={isStatusUpdating}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                提交审核
                              </Button>
                            )}

                            {(content.status === 'REVIEW' || content.status === 'PENDING') && (session?.user?.role === 'ADMIN' || session?.user?.role === 'OPERATOR') && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(content.id, 'PUBLISHED')}
                                  disabled={isStatusUpdating}
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  通过并发布
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(content.id, 'REJECTED')}
                                  disabled={isStatusUpdating}
                                  className="bg-red-50 text-red-700 hover:bg-red-100"
                                >
                                  拒绝
                                </Button>
                              </>
                            )}

                            {/* 编辑按钮 */}
                            <Link href={`/dashboard/contents/edit/${content.id}`}>
                              <Button variant="outline" size="sm">编辑</Button>
                            </Link>

                            {/* 删除按钮 */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContent(content.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* 拒绝原因对话框 */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>拒绝内容</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-2 text-sm text-gray-600">请输入拒绝原因（将发送给作者）：</p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false)
                  setRejectReason('')
                  setSelectedContentId(null)
                }}
                disabled={isStatusUpdating}
              >
                取消
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={isStatusUpdating || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isStatusUpdating ? '提交中...' : '提交'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/contents',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
