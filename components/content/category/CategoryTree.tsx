import React from 'react'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/date'
import { Category } from '@/stores/contentStore'

interface CategoryTreeProps {
  categories: any[] // 使用any[]表示树形结构的分类数据
  isLoading: boolean
  error: string | null
  searchTerm: string
  onSearchChange: (value: string) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

/**
 * 分类树列表组件
 * 用于展示分类树形结构
 */
export default function CategoryTree({
  categories,
  isLoading,
  error,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete
}: CategoryTreeProps) {
  // 渲染分类树
  const renderCategoryTree = (categories: any[], level = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        <TableRow>
          <TableCell>
            <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center">
              {level > 0 && (
                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {category.name}
            </div>
          </TableCell>
          <TableCell>{category.slug}</TableCell>
          <TableCell>{category.order}</TableCell>
          <TableCell>{category._count?.pages || 0}</TableCell>
          <TableCell>{formatDate(category.createdAt)}</TableCell>
          <TableCell>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(category)}
              >
                编辑
              </Button>
              <Button
                variant="error"
                size="sm"
                onClick={() => onDelete(category)}
                disabled={category._count?.children > 0 || category._count?.pages > 0}
              >
                删除
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {category.children && category.children.length > 0 && renderCategoryTree(category.children, level + 1)}
      </React.Fragment>
    ))
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>分类列表</CardTitle>
          <div className="w-64">
            <Input
              placeholder="搜索分类..."
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
              <TableHead>排序</TableHead>
              <TableHead>内容数量</TableHead>
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
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  暂无分类
                </TableCell>
              </TableRow>
            ) : (
              renderCategoryTree(categories)
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
