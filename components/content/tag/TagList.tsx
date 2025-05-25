import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/date'
import { Tag } from '@/stores/contentStore'

interface TagListProps {
  tags: Tag[]
  totalTags: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  searchTerm: string
  onSearchChange: (value: string) => void
  onPageChange: (page: number) => void
  onEdit: (tag: Tag) => void
  onMerge: (tag: Tag) => void
  onDelete: (tag: Tag) => void
}

/**
 * 标签列表组件
 * 用于展示标签列表
 */
export default function TagList({
  tags,
  totalTags,
  currentPage,
  pageSize,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  onPageChange,
  onEdit,
  onMerge,
  onDelete
}: TagListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>标签列表</CardTitle>
          <div className="w-64">
            <Input
              placeholder="搜索标签..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>别名</TableHead>
              <TableHead>使用次数</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-error-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  暂无标签
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.name}</TableCell>
                  <TableCell>{tag.slug}</TableCell>
                  <TableCell>{tag.useCount}</TableCell>
                  <TableCell>{formatDate(tag.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/content?tagId=${tag.id}`}>
                        <Button variant="outline" size="sm">
                          查看内容
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(tag)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onMerge(tag)}
                      >
                        合并
                      </Button>
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => onDelete(tag)}
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
          共 {totalTags} 个标签
        </div>
        {totalTags > pageSize && (
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
                  第 {currentPage} 页，共 {Math.ceil(totalTags / pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalTags / pageSize)}
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
