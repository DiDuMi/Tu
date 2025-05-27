import React, { useState, useEffect } from 'react'

interface KeyboardShortcutsProps {
  onSave?: () => void
  onPublish?: () => void
  onCancel?: () => void
}

export default function KeyboardShortcuts({
  onSave,
  onPublish,
  onCancel
}: KeyboardShortcutsProps) {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }

      // Ctrl/Cmd + Enter: 发布
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onPublish?.()
      }

      // Escape: 取消
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }

      // Ctrl/Cmd + /: 显示快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, onPublish, onCancel])

  if (!showShortcuts) {
    return (
      <button
        type="button"
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="显示快捷键 (Ctrl+/)"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">键盘快捷键</h3>
          <button
            onClick={() => setShowShortcuts(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">保存草稿</span>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Ctrl
              </kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                S
              </kbd>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">提交发布</span>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Ctrl
              </kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Enter
              </kbd>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">取消编辑</span>
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
              Esc
            </kbd>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">显示快捷键</span>
            <div className="flex items-center space-x-1">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                Ctrl
              </kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                /
              </kbd>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            在 Mac 上使用 Cmd 键替代 Ctrl 键
          </p>
        </div>
      </div>
    </div>
  )
}
