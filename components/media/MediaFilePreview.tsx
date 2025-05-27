import React, { useState, useEffect } from 'react'

import { MediaUploadResponse } from '@/types/api'
import { formatFileSize } from '@/lib/upload'
import useMediaStore from '@/stores/mediaStore'

interface MediaFilePreviewProps {
  file: File
  uploadedMedia?: MediaUploadResponse
  error?: string
}

export default function MediaFilePreview({ file, uploadedMedia, error }: MediaFilePreviewProps) {
  const { uploadProgress } = useMediaStore()
  const progress = uploadProgress[file.name] || 0

  // 创建文件预览URL
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    // 如果已上传成功，使用服务器返回的URL
    if (uploadedMedia?.url) {
      setPreviewUrl(uploadedMedia.url)
      return
    }

    // 否则创建本地预览
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, uploadedMedia])

  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-lg">
      {/* 文件预览 */}
      <div className="w-12 h-12 mr-3 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
        {previewUrl && file.type.startsWith('image/') ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

        {/* 上传进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full ${uploadedMedia ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 上传状态 */}
      <div className="ml-3">
        {error ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={error}>
            失败
          </span>
        ) : uploadedMedia ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            完成
          </span>
        ) : progress === 100 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            处理中
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {progress}%
          </span>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="w-full mt-1 text-xs text-red-600 truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}

export type { MediaFilePreviewProps }
