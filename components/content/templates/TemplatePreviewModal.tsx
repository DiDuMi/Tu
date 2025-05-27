import React from 'react'

interface ContentTemplate {
  id: number
  uuid: string
  title: string
  content: string
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  description?: string
  isPublic: boolean
  isActive: boolean
  useCount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    avatar?: string
  }
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface TemplatePreviewModalProps {
  template: ContentTemplate | null
  onClose: () => void
}

export default function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  if (!template) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">模板预览</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
          {template.description && (
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
          )}
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>
      </div>
    </div>
  )
}

export type { ContentTemplate }
