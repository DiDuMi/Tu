import { useState } from 'react'
import { useRouter } from 'next/router'

import TinyMCEEditor from '@/components/content/TinyMCEEditor'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { extractExcerpt } from '@/lib/content'
import { Category, Tag } from '@/stores/contentStore'

interface EditContentFormProps {
  id: string
  editingTitle: string
  editingContent: string
  editingExcerpt: string | null
  editingCategoryId: number | null
  editingStatus: string
  editingFeatured: boolean
  editingScheduledPublishAt: string | null
  editingScheduledArchiveAt: string | null
  editingChangeLog: string | null
  extractedTags: string[]
  selectedTagIds: number[]
  categories: Category[]
  tags: Tag[]
  isSubmitting: boolean
  error: string | null
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onExcerptChange: (value: string) => void
  onCategoryChange: (value: number | null) => void
  onStatusChange: (value: string) => void
  onFeaturedChange: (value: boolean) => void
  onScheduledPublishAtChange: (value: string | null) => void
  onScheduledArchiveAtChange: (value: string | null) => void
  onChangeLogChange: (value: string) => void
  onTagSelect: (tagId: number) => void
  onSubmit: (data: any) => Promise<void>
}

export default function EditContentForm({
  id,
  editingTitle,
  editingContent,
  editingExcerpt,
  editingCategoryId,
  editingStatus,
  editingFeatured,
  editingScheduledPublishAt,
  editingScheduledArchiveAt,
  editingChangeLog,
  extractedTags,
  selectedTagIds,
  categories,
  tags,
  isSubmitting,
  error,
  onTitleChange,
  onContentChange,
  onExcerptChange,
  onCategoryChange,
  onStatusChange,
  onFeaturedChange,
  onScheduledPublishAtChange,
  onScheduledArchiveAtChange,
  onChangeLogChange,
  onTagSelect,
  onSubmit,
}: EditContentFormProps) {
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTitle || !editingContent) {
      return
    }

    await onSubmit({
      title: editingTitle,
      content: editingContent,
      excerpt: editingExcerpt || extractExcerpt(editingContent),
      status: editingStatus,
      categoryId: editingCategoryId,
      tagIds: selectedTagIds,
      featured: editingFeatured,
      scheduledPublishAt: editingScheduledPublishAt,
      scheduledArchiveAt: editingScheduledArchiveAt,
      changeLog: editingChangeLog,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标题
                </label>
                <Input
                  value={editingTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="输入标题，可以使用 #标签 格式添加标签"
                  fullWidth
                  className="w-full"
                />
                {extractedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractedTags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <TinyMCEEditor
                  value={editingContent}
                  onChange={onContentChange}
                  height={500}
                  placeholder="输入内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  摘要（可选）
                </label>
                <Textarea
                  value={editingExcerpt || ''}
                  onChange={(e) => onExcerptChange(e.target.value)}
                  placeholder="输入内容摘要，用于在列表页面和搜索结果中显示内容简介"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  摘要用于在内容列表、搜索结果和分享预览中显示内容简介。如果不填写，系统将自动从正文内容中提取前200个字符作为摘要。建议手动填写以获得更好的展示效果。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>高级设置</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '收起' : '展开'}
              </Button>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      计划发布时间（可选）
                    </label>
                    <Input
                      type="datetime-local"
                      value={editingScheduledPublishAt || ''}
                      onChange={(e) => onScheduledPublishAtChange(e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      计划下线时间（可选）
                    </label>
                    <Input
                      type="datetime-local"
                      value={editingScheduledArchiveAt || ''}
                      onChange={(e) => onScheduledArchiveAtChange(e.target.value || null)}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="featured"
                    checked={editingFeatured}
                    onChange={(e) => onFeaturedChange(e.target.checked)}
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 text-sm text-gray-700"
                  >
                    设为精选推荐
                  </label>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <Select
                  value={editingStatus}
                  onChange={(e) => onStatusChange(e.target.value)}
                  options={[
                    { value: 'DRAFT', label: '草稿' },
                    { value: 'REVIEW', label: '提交审核' },
                    { value: 'PUBLISHED', label: '已发布' },
                    { value: 'ARCHIVED', label: '归档' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <Select
                  value={editingCategoryId?.toString() || ''}
                  onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: '无分类' },
                    ...categories.map(category => ({
                      value: category.id.toString(),
                      label: category.name
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签
                </label>
                <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
                  {tags.length > 0 ? (
                    <div className="space-y-2">
                      {tags.map(tag => (
                        <div key={tag.id} className="flex items-center">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={() => onTagSelect(tag.id)}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            {tag.name}
                            <span className="text-xs text-gray-500 ml-1">
                              ({tag.useCount})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      暂无标签
                    </p>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  除了选择已有标签，您还可以在标题中使用 #标签 格式添加新标签
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  变更说明
                </label>
                <Textarea
                  value={editingChangeLog || ''}
                  onChange={(e) => onChangeLogChange(e.target.value)}
                  placeholder="简要描述此次修改的内容（可选）"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/content/${id}`)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!editingTitle || !editingContent}
              >
                保存修改
              </Button>
            </CardFooter>
          </Card>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}
        </div>
      </div>
    </form>
  )
}
