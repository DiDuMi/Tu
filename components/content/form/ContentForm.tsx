import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import TinyMCEEditor from '@/components/content/TinyMCEEditor'
import { extractTagsFromTitle } from '@/lib/content'
import { Category, Tag } from '@/stores/contentStore'
import { useHomepagePermissions } from '@/hooks/useHomepagePermissions'

interface ContentFormProps {
  title: string
  content: string
  excerpt: string | null
  categoryId: number | null
  status: string
  featured: boolean
  scheduledPublishAt: string | null
  scheduledArchiveAt: string | null
  changeLog?: string | null
  selectedTagIds: number[]
  categories: Category[]
  tags: Tag[]
  isSubmitting: boolean
  error: string | null
  isEdit?: boolean
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onExcerptChange: (value: string) => void
  onCategoryChange: (value: number | null) => void
  onStatusChange: (value: string) => void
  onFeaturedChange: (value: boolean) => void
  onScheduledPublishAtChange: (value: string | null) => void
  onScheduledArchiveAtChange: (value: string | null) => void
  onChangeLogChange?: (value: string) => void
  onTagSelect: (tagId: number) => void
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
}

/**
 * 内容表单组件
 * 用于创建和编辑内容
 */
export default function ContentForm({
  title,
  content,
  excerpt,
  categoryId,
  status,
  featured,
  scheduledPublishAt,
  scheduledArchiveAt,
  changeLog,
  selectedTagIds,
  categories,
  tags,
  isSubmitting,
  error,
  isEdit = false,
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
  onCancel,
  onSubmit
}: ContentFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [extractedTags, setExtractedTags] = useState<string[]>([])

  // 使用首页权限Hook
  const { availableCategories, isHomepageCategory } = useHomepagePermissions(categories)

  // 处理标题变化，提取标签
  useEffect(() => {
    if (title) {
      const { tags } = extractTagsFromTitle(title)
      setExtractedTags(tags)
    } else {
      setExtractedTags([])
    }
  }, [title])

  return (
    <form onSubmit={onSubmit}>
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
                  value={title}
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
                  value={content}
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
                  value={excerpt || ''}
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
                      value={scheduledPublishAt || ''}
                      onChange={(e) => onScheduledPublishAtChange(e.target.value || null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      计划下线时间（可选）
                    </label>
                    <Input
                      type="datetime-local"
                      value={scheduledArchiveAt || ''}
                      onChange={(e) => onScheduledArchiveAtChange(e.target.value || null)}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="featured"
                    checked={featured}
                    onChange={(e) => onFeaturedChange(e.target.checked)}
                  />
                  <label
                    htmlFor="featured"
                    className="ml-2 text-sm text-gray-700"
                  >
                    设为精选内容
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
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  options={[
                    { value: 'DRAFT', label: '草稿' },
                    { value: 'REVIEW', label: '提交审核' },
                    ...(isEdit ? [{ value: 'PUBLISHED', label: '已发布' }, { value: 'ARCHIVED', label: '归档' }] : [{ value: 'PUBLISHED', label: '直接发布' }]),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <Select
                  value={categoryId?.toString() || ''}
                  onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : null)}
                  options={[
                    { value: '', label: '无分类' },
                    ...availableCategories.map(category => ({
                      value: category.id.toString(),
                      label: category.name + (isHomepageCategory(category.slug) ? ' (首页分类)' : '')
                    }))
                  ]}
                />
                {categories.length > availableCategories.length && (
                  <p className="mt-1 text-xs text-yellow-600">
                    部分首页分类因权限限制未显示。如需发布到首页分类，请联系管理员。
                  </p>
                )}
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

              {isEdit && onChangeLogChange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    变更说明
                  </label>
                  <Textarea
                    value={changeLog || ''}
                    onChange={(e) => onChangeLogChange(e.target.value)}
                    placeholder="简要描述此次修改的内容（可选）"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!title || !content}
              >
                {isEdit ? '保存修改' : '创建内容'}
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
