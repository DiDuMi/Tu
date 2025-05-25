import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatContentStatus } from '@/lib/content'
import { formatDate } from '@/lib/date'
import { Page } from '@/stores/contentStore'

interface ContentListProps {
  pages: Page[]
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  onPageChange: (page: number) => void
  onDelete: (page: Page) => void
}

/**
 * 内容列表组件
 * 用于展示内容列表
 */
export default function ContentList({
  pages,
  totalPages,
  currentPage,
  pageSize,
  isLoading,
  error,
  onPageChange,
  onDelete
}: ContentListProps) {
  // 获取内容状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">{formatContentStatus(status)}</Badge>
      case 'DRAFT':
        return <Badge variant="default">{formatContentStatus(status)}</Badge>
      case 'PENDING_REVIEW':
        return <Badge variant="warning">{formatContentStatus(status)}</Badge>
      case 'REJECTED':
        return <Badge variant="error">{formatContentStatus(status)}</Badge>
      case 'ARCHIVED':
        return <Badge variant="outline">{formatContentStatus(status)}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容列表</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-error-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无内容
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {page.title}
                      {page.featured && (
                        <Badge variant="secondary" className="ml-2">
                          精选
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(page.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex-shrink-0 mr-2">
                        {page.user?.image ? (
                          <img
                            src={page.user.image}
                            alt={page.user.name}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
                            {page.user?.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm">{page.user?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {page.category ? (
                      <Badge variant="outline">{page.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(page.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content/${page.uuid}`}>
                        <Button variant="outline" size="sm">
                          查看
                        </Button>
                      </Link>
                      <Link href={`/admin/content/${page.uuid}/edit`}>
                        <Button variant="secondary" size="sm">
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => onDelete(page)}
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          共 {totalPages} 条内容
        </div>
        {totalPages > pageSize && (
          <div className="mt-4">
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="px-4 py-2 text-sm">
                  第 {currentPage} 页，共 {Math.ceil(totalPages / pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalPages / pageSize)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
