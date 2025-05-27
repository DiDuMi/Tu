import React from 'react'
import { Upload, Maximize2, X } from 'lucide-react'

interface MinimizedUploadProps {
  isVisible: boolean
  uploadCount: number
  completedCount: number
  failedCount: number
  isUploading: boolean
  onRestore: () => void
  onClose: () => void
}

const MinimizedUpload: React.FC<MinimizedUploadProps> = ({
  isVisible,
  uploadCount,
  completedCount,
  failedCount,
  isUploading,
  onRestore,
  onClose
}) => {
  if (!isVisible) return null

  const pendingCount = uploadCount - completedCount - failedCount

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Upload className={`w-5 h-5 ${isUploading ? 'text-blue-500 animate-pulse' : 'text-gray-500'}`} />
            <span className="font-medium text-gray-900">批量上传</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onRestore}
              className="text-gray-400 hover:text-gray-600"
              title="展开"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>总计:</span>
            <span>{uploadCount} 个文件</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex justify-between">
              <span>待上传:</span>
              <span className="text-orange-600">{pendingCount}</span>
            </div>
          )}
          {completedCount > 0 && (
            <div className="flex justify-between">
              <span>已完成:</span>
              <span className="text-green-600">{completedCount}</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex justify-between">
              <span>失败:</span>
              <span className="text-red-600">{failedCount}</span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadCount > 0 ? (completedCount / uploadCount) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {isUploading ? '上传中...' : '上传完成'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MinimizedUpload
