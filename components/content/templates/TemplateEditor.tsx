import React from 'react'

import { Label } from '@/components/ui/Label'

import { useTemplateForm, type ContentTemplate } from '@/hooks/useTemplateForm'

import TinyMCEEditor from '@/components/content/TinyMCEEditor'
import EnhancedTagSelector from '@/components/content/EnhancedTagSelector'
import TemplateBasicFields from './TemplateBasicFields'
import TemplateSettingsFields from './TemplateSettingsFields'
import TemplateFormActions from './TemplateFormActions'



interface TemplateEditorProps {
  template?: ContentTemplate | null
  onSave: (template: ContentTemplate) => void
  onCancel: () => void
}

export default function TemplateEditor({
  template,
  onSave,
  onCancel
}: TemplateEditorProps) {
  const {
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    isActive,
    setIsActive,
    selectedTagIds,
    sortOrder,
    setSortOrder,
    isSubmitting,
    error,
    validationErrors,
    tags,
    handleTagSelect,
    handleSubmit,
    handleButtonClick
  } = useTemplateForm({ template, onSave })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">
            {template ? '编辑模板' : '创建模板'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* 基本信息 */}
            <TemplateBasicFields
              title={title}
              setTitle={setTitle}
              type={type}
              setType={setType}
              description={description}
              setDescription={setDescription}
              validationErrors={validationErrors}
            />

            {/* 内容编辑器 */}
            <div>
              <Label>
                内容 <span className="text-red-500">*</span>
              </Label>
              <div className="mt-2">
                <TinyMCEEditor
                  value={content}
                  onChange={setContent}
                  height={300}
                  placeholder="输入模板内容..."
                />
              </div>
              {validationErrors.content && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
              )}
            </div>

            {/* 标签选择 */}
            <EnhancedTagSelector
              tags={tags}
              selectedTagIds={selectedTagIds}
              onTagSelect={handleTagSelect}
            />

            {/* 设置选项 */}
            <TemplateSettingsFields
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
              isActive={isActive}
              setIsActive={setIsActive}
            />
          </div>

          {/* 操作按钮 */}
          <TemplateFormActions
            template={template}
            isSubmitting={isSubmitting}
            content={content}
            validationErrors={validationErrors}
            onCancel={onCancel}
            onButtonClick={handleButtonClick}
          />
        </form>
      </div>
    </div>
  )
}
