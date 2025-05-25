import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'

interface BatchUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (mediaList: any[]) => void
  initialFiles?: File[]
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const BatchUploadDialog: React.FC<BatchUploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  initialFiles
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // 处理初始文件
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      // 自动开始上传初始文件
      onDrop(initialFiles)
    }
  }, [isOpen, initialFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const initialProgress = acceptedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending' as const
    }))
    setUploadProgress(initialProgress)

    const uploadedMedia = []

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]

      // 更新状态为上传中
      setUploadProgress(prev => prev.map((item, index) =>
        index === i ? { ...item, status: 'uploading' } : item
      ))

      try {
        const formData = new FormData()
        formData.append('file', file)

        const xhr = new XMLHttpRequest()

        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(prev => prev.map((item, index) =>
              index === i ? { ...item, progress } : item
            ))
          }
        })

        const response = await new Promise<any>((resolve, reject) => {
          xhr.open('POST', '/api/v1/media/upload')

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText)
                if (data.success) {
                  resolve(data.data)
                } else {
                  reject(new Error(data.error?.message || '上传失败'))
                }
              } catch (error) {
                reject(new Error('解析响应失败'))
              }
            } else {
              reject(new Error(`上传失败: ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('网络错误'))
          xhr.send(formData)
        })

        uploadedMedia.push(response)

        // 更新状态为成功
        setUploadProgress(prev => prev.map((item, index) =>
          index === i ? { ...item, status: 'success', progress: 100 } : item
        ))

      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error)

        // 更新状态为失败
        setUploadProgress(prev => prev.map((item, index) =>
          index === i ? {
            ...item,
            status: 'error',
            error: error instanceof Error ? error.message : '上传失败'
          } : item
        ))
      }
    }

    setIsUploading(false)

    if (uploadedMedia.length > 0) {
      onUploadComplete(uploadedMedia)
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.avi', '.mov']
    },
    multiple: true,
    disabled: isUploading
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">批量上传媒体</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* 拖拽上传区域 */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <div className="text-lg font-medium">
              {isDragActive ? '释放文件开始上传' : '拖拽文件到这里或点击选择'}
            </div>
            <div className="text-sm text-gray-500">
              支持图片（JPG、PNG、GIF、WebP）和视频（MP4、WebM、AVI、MOV）
            </div>
            <div className="text-xs text-gray-400">
              文件将自动压缩优化，保持最佳质量和文件大小平衡
            </div>
          </div>
        </div>

        {/* 上传进度 */}
        {uploadProgress.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">上传进度</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {uploadProgress.map((item, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate flex-1 mr-2">
                      {item.fileName}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.status === 'success' ? 'bg-green-100 text-green-800' :
                      item.status === 'error' ? 'bg-red-100 text-red-800' :
                      item.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'success' ? '✓ 完成' :
                       item.status === 'error' ? '✗ 失败' :
                       item.status === 'uploading' ? '上传中' : '等待'}
                    </span>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.error && (
                    <div className="text-xs text-red-600 mt-1">{item.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {isUploading ? '上传中...' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BatchUploadDialog
