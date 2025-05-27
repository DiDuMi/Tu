import React from 'react'

import { Button } from '@/components/ui/Button'

import { type ContentTemplate } from '@/hooks/useTemplateForm'

interface TemplateFormActionsProps {
  template?: ContentTemplate | null
  isSubmitting: boolean
  content: string
  validationErrors: {[key: string]: string}
  onCancel: () => void
  onButtonClick: (e: React.MouseEvent) => void
}

export default function TemplateFormActions({
  template,
  isSubmitting,
  content,
  validationErrors,
  onCancel,
  onButtonClick
}: TemplateFormActionsProps) {
  const isDisabled = isSubmitting || !content.trim() || Object.keys(validationErrors).length > 0

  const getButtonTitle = () => {
    if (isSubmitting) return '正在提交...'
    if (!content.trim()) return '请输入内容'
    if (Object.keys(validationErrors).length > 0) {
      return `验证错误: ${Object.values(validationErrors).join(', ')}`
    }
    return '点击创建模板'
  }

  return (
    <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50 flex-shrink-0">
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
        disabled={isDisabled}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        onClick={onButtonClick}
        title={getButtonTitle()}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            保存中...
          </>
        ) : (
          template ? '更新模板' : '创建模板'
        )}
      </Button>

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500">
          <div>内容长度: {content.length}</div>
          <div>内容为空: {!content.trim() ? '是' : '否'}</div>
          <div>验证错误: {Object.keys(validationErrors).length}</div>
          <div>提交中: {isSubmitting ? '是' : '否'}</div>
        </div>
      )}
    </div>
  )
}

export type { TemplateFormActionsProps }
