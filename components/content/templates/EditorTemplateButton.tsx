import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import TemplateEditor from './TemplateEditor'
import { fetcher } from '@/lib/utils'

interface Template {
  id: number
  title: string
  content: string
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  description?: string
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  createdAt: string
  updatedAt: string
}

interface EditorTemplateButtonProps {
  onInsertTemplate: (content: string, position: 'top' | 'cursor' | 'bottom') => void
  title?: string
  className?: string
}

export default function EditorTemplateButton({
  onInsertTemplate,
  title = '',
  className = ''
}: EditorTemplateButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 获取模板数据
  const { data: templatesData, error, mutate: mutateTemplates } = useSWR(
    '/api/v1/content-templates?limit=100&sortBy=updatedAt&sortOrder=desc',
    fetcher
  )

  // 获取标签数据
  const { data: tagsData } = useSWR('/api/v1/tags', fetcher)
  const tags = tagsData?.data?.items || []
  const templates = templatesData?.data?.items || []

  // 从标题中提取标签
  const extractTagsFromTitle = (title: string): string[] => {
    const tagRegex = /#([^\s#]+)/g
    const matches = title.match(tagRegex)
    return matches ? matches.map(tag => tag.slice(1)) : []
  }

  // 智能推荐：根据标题中的标签推荐模板，支持同一标签的多个模板
  const getRecommendedTemplates = (): Template[] => {
    if (!title.trim()) return []

    const titleTags = extractTagsFromTitle(title)
    if (titleTags.length === 0) return []

    // 获取所有匹配的模板
    const matchedTemplates = templates.filter((template: Template) =>
      template.tags.some(tag =>
        titleTags.some(titleTag =>
          tag.name.toLowerCase().includes(titleTag.toLowerCase()) ||
          tag.slug.toLowerCase().includes(titleTag.toLowerCase())
        )
      )
    )

    // 按匹配度和更新时间排序，优先显示匹配度高的和最近更新的
    return matchedTemplates.sort((a, b) => {
      // 计算匹配的标签数量
      const aMatches = a.tags.filter(tag =>
        titleTags.some(titleTag =>
          tag.name.toLowerCase().includes(titleTag.toLowerCase()) ||
          tag.slug.toLowerCase().includes(titleTag.toLowerCase())
        )
      ).length

      const bMatches = b.tags.filter(tag =>
        titleTags.some(titleTag =>
          tag.name.toLowerCase().includes(titleTag.toLowerCase()) ||
          tag.slug.toLowerCase().includes(titleTag.toLowerCase())
        )
      ).length

      // 首先按匹配数量排序
      if (aMatches !== bMatches) {
        return bMatches - aMatches
      }

      // 然后按更新时间排序
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }

  // 过滤模板
  useEffect(() => {
    let filtered = templates

    // 搜索过滤
    if (searchTerm.trim()) {
      filtered = filtered.filter((template: Template) =>
        template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter((template: Template) =>
        template.tags.some(tag => selectedTags.includes(tag.id))
      )
    }

    setFilteredTemplates(filtered)
  }, [templates, searchTerm, selectedTags])

  // 处理标签选择
  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // 处理模板插入
  const handleInsert = (template: Template, position: 'top' | 'cursor' | 'bottom') => {
    onInsertTemplate(template.content, position)
    setIsOpen(false)
  }

  // 处理创建新模板
  const handleCreateTemplate = () => {
    setShowCreateModal(true)
    setIsOpen(false)
  }

  // 处理模板创建成功
  const handleTemplateCreated = (newTemplate: Template) => {
    setShowCreateModal(false)
    mutateTemplates() // 刷新模板列表
    // 可选：自动插入新创建的模板
    // onInsertTemplate(newTemplate.content, 'cursor')
  }

  // 处理模板创建取消
  const handleCreateCancel = () => {
    setShowCreateModal(false)
  }

  const recommendedTemplates = getRecommendedTemplates()

  if (error) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* 触发按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm"
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        预设模板
        {recommendedTemplates.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {recommendedTemplates.length}
          </Badge>
        )}
      </Button>

      {/* 模板选择面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">选择模板</h4>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTemplate}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  新建模板
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 搜索框 */}
            <Input
              placeholder="搜索模板..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />

            {/* 标签过滤 */}
            {tags.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 8).map((tag: any) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {/* 智能推荐 */}
            {recommendedTemplates.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <h5 className="text-sm font-medium text-orange-600 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  智能推荐
                </h5>
                <div className="space-y-2">
                  {recommendedTemplates.slice(0, 6).map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onInsert={handleInsert}
                      isRecommended={true}
                    />
                  ))}
                  {recommendedTemplates.length > 6 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500">
                        还有 {recommendedTemplates.length - 6} 个相关模板，请在下方查看
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 所有模板 */}
            <div className="p-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">暂无匹配的模板</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onInsert={handleInsert}
                      isRecommended={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 创建模板模态框 */}
      {showCreateModal && (
        <TemplateEditor
          onSave={handleTemplateCreated}
          onCancel={handleCreateCancel}
        />
      )}
    </div>
  )
}

// 模板项组件
interface TemplateItemProps {
  template: Template
  onInsert: (template: Template, position: 'top' | 'cursor' | 'bottom') => void
  isRecommended: boolean
}

function TemplateItem({ template, onInsert, isRecommended }: TemplateItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
        isRecommended
          ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h6 className="text-sm font-medium text-gray-900 truncate">
            {template.title || '无标题模板'}
          </h6>
          {template.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {template.description}
            </p>
          )}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={() => onInsert(template, 'top')}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="插入到顶部"
            >
              顶部
            </button>
            <button
              onClick={() => onInsert(template, 'cursor')}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              title="插入到光标位置"
            >
              光标
            </button>
            <button
              onClick={() => onInsert(template, 'bottom')}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              title="插入到底部"
            >
              底部
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
