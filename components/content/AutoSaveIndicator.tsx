import React from 'react'

interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  getLastSavedText: () => string | null
  onSaveNow?: () => void
}

export default function AutoSaveIndicator({
  isSaving,
  lastSaved,
  saveError,
  getLastSavedText,
  onSaveNow
}: AutoSaveIndicatorProps) {
  const lastSavedText = getLastSavedText()

  if (saveError) {
    return (
      <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="flex-1">保存失败: {saveError}</span>
        {onSaveNow && (
          <button
            onClick={onSaveNow}
            className="ml-2 text-xs text-red-700 hover:text-red-800 underline"
          >
            重试
          </button>
        )}
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        正在保存草稿...
      </div>
    )
  }

  if (lastSaved && lastSavedText) {
    return (
      <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="flex-1">{lastSavedText}</span>
        {onSaveNow && (
          <button
            onClick={onSaveNow}
            className="ml-2 text-xs text-green-700 hover:text-green-800 underline"
          >
            立即保存
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <span className="flex-1">等待保存...</span>
      {onSaveNow && (
        <button
          onClick={onSaveNow}
          className="ml-2 text-xs text-gray-700 hover:text-gray-800 underline"
        >
          立即保存
        </button>
      )}
    </div>
  )
}
