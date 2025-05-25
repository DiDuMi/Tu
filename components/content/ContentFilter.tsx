import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Category, Tag } from '@/stores/contentStore'

interface ContentFilterProps {
  searchTerm: string
  status: string
  categoryId: string
  tagId: string
  sortBy: string
  sortDirection: string
  categories: Category[]
  tags: Tag[]
  onSearch: (value: string) => void
  onStatusChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onTagChange: (value: string) => void
  onSortByChange: (value: string) => void
  onSortDirectionChange: (value: string) => void
  onReset: () => void
}

/**
 * 内容筛选组件
 * 用于筛选内容列表
 */
export default function ContentFilter({
  searchTerm,
  status,
  categoryId,
  tagId,
  sortBy,
  sortDirection,
  categories,
  tags,
  onSearch,
  onStatusChange,
  onCategoryChange,
  onTagChange,
  onSortByChange,
  onSortDirectionChange,
  onReset
}: ContentFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>筛选条件</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '收起' : '高级筛选'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜索
            </label>
            <Input
              placeholder="搜索标题或内容..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <Select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              options={[
                { value: '', label: '全部状态' },
                { value: 'PUBLISHED', label: '已发布' },
                { value: 'DRAFT', label: '草稿' },
                { value: 'REVIEW', label: '审核中' },
                { value: 'REJECTED', label: '已拒绝' },
                { value: 'ARCHIVED', label: '已归档' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <Select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              options={[
                { value: '', label: '全部分类' },
                ...categories.map(category => ({
                  value: category.id.toString(),
                  label: category.name
                }))
              ]}
            />
          </div>

          {showAdvanced && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签
                </label>
                <Select
                  value={tagId}
                  onChange={(e) => onTagChange(e.target.value)}
                  options={[
                    { value: '', label: '全部标签' },
                    ...tags.map(tag => ({
                      value: tag.id.toString(),
                      label: tag.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序字段
                </label>
                <Select
                  value={sortBy}
                  onChange={(e) => onSortByChange(e.target.value)}
                  options={[
                    { value: 'createdAt', label: '创建时间' },
                    { value: 'updatedAt', label: '更新时间' },
                    { value: 'title', label: '标题' },
                    { value: 'viewCount', label: '浏览量' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序方向
                </label>
                <Select
                  value={sortDirection}
                  onChange={(e) => onSortDirectionChange(e.target.value)}
                  options={[
                    { value: 'desc', label: '降序' },
                    { value: 'asc', label: '升序' },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          onClick={onReset}
        >
          重置筛选
        </Button>
      </CardFooter>
    </Card>
  )
}
