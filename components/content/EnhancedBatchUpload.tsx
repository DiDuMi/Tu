import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Pause, Play, Trash2, CheckCircle, XCircle, Clock, Minimize2 } from 'lucide-react'
import UploadProgress from '@/components/ui/UploadProgress'

interface UploadStats {
  uploadCount: number
  completedCount: number
  failedCount: number
  isUploading: boolean
}

interface EnhancedBatchUploadProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (mediaList: any[]) => void
  initialFiles?: File[]
  allowCancel?: boolean
  allowPause?: boolean
  maxConcurrent?: number
  onMinimize?: () => void
  onStatsUpdate?: (stats: UploadStats) => void
}

interface FileUploadItem {
  file: File
  taskId: string | null
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused'
  result?: any
  error?: string
}

const EnhancedBatchUpload = forwardRef<any, EnhancedBatchUploadProps>(({
  isOpen,
  onClose,
  onUploadComplete,
  initialFiles,
  allowCancel = true,
  allowPause = false,
  maxConcurrent = 3,
  onMinimize,
  onStatsUpdate
}, ref) => {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [completedUploads, setCompletedUploads] = useState<any[]>([])
  const [hasActiveUploads, setHasActiveUploads] = useState(false)

  // 处理初始文件
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      const items = initialFiles.map(file => ({
        file,
        taskId: null,
        status: 'pending' as const
      }))
      setUploadItems(items)
    }
  }, [isOpen, initialFiles])

  // 文件拖拽处理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map(file => ({
      file,
      taskId: null,
      status: 'pending' as const
    }))
    setUploadItems(prev => [...prev, ...newItems])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.avi', '.mov', '.wmv', '.flv', '.3gp'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.aac', '.m4a']
    },
    multiple: true,
    disabled: isUploading
  })

  // 监听上传状态变化
  useEffect(() => {
    const activeCount = uploadItems.filter(item =>
      item.status === 'uploading' || item.status === 'processing'
    ).length
    setHasActiveUploads(activeCount > 0)

    // 同步状态到父组件
    if (onStatsUpdate) {
      const completedCount = uploadItems.filter(item => item.status === 'completed').length
      const failedCount = uploadItems.filter(item => item.status === 'failed').length

      onStatsUpdate({
        uploadCount: uploadItems.length,
        completedCount,
        failedCount,
        isUploading: activeCount > 0
      })
    }
  }, [uploadItems, onStatsUpdate])

  // 页面离开提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasActiveUploads) {
        e.preventDefault()
        e.returnValue = '您有文件正在上传中，确定要离开页面吗？'
        return '您有文件正在上传中，确定要离开页面吗？'
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (hasActiveUploads) {
        const confirmLeave = window.confirm('您有文件正在上传中，确定要离开页面吗？')
        if (!confirmLeave) {
          // 阻止导航
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    if (hasActiveUploads) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('popstate', handlePopState)
      // 添加一个历史记录条目，用于拦截后退
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasActiveUploads])

  // 暴露组件方法给父组件
  useImperativeHandle(ref, () => ({
    getUploadStats: () => ({
      uploadCount: uploadItems.length,
      completedCount: uploadItems.filter(item => item.status === 'completed').length,
      failedCount: uploadItems.filter(item => item.status === 'failed').length,
      isUploading: hasActiveUploads
    }),
    getUploadItems: () => uploadItems,
    clearCompleted: () => {
      setUploadItems(prev => prev.filter(item => item.status !== 'completed'))
    }
  }), [uploadItems, hasActiveUploads])

  // 开始上传
  const startUpload = async () => {
    if (uploadItems.length === 0) return

    setIsUploading(true)
    const pendingItems = uploadItems.filter(item => item.status === 'pending')

    // 限制并发上传数量
    for (let i = 0; i < pendingItems.length; i += maxConcurrent) {
      const batch = pendingItems.slice(i, i + maxConcurrent)

      await Promise.all(batch.map(async (item, index) => {
        const actualIndex = uploadItems.findIndex(ui => ui.file === item.file)
        await uploadSingleFile(actualIndex)
      }))
    }

    setIsUploading(false)
  }

  // 上传单个文件
  const uploadSingleFile = async (index: number) => {
    const item = uploadItems[index]
    if (!item || item.status !== 'pending') return

    try {
      // 更新状态为上传中
      setUploadItems(prev => prev.map((item, i) =>
        i === index ? { ...item, status: 'uploading' } : item
      ))

      console.log('📤 开始上传文件:', {
        fileName: item.file.name,
        fileSize: item.file.size,
        fileType: item.file.type
      })

      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('title', item.file.name)
      formData.append('description', '批量上传')

      const response = await fetch('/api/v1/media/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('📤 上传响应状态:', response.status)

      const data = await response.json()
      console.log('📤 上传响应数据:', data)

      if (response.ok && data.success) {
        // 更新任务ID
        setUploadItems(prev => prev.map((item, i) =>
          i === index ? {
            ...item,
            taskId: data.data?.taskId,
            status: 'processing'
          } : item
        ))

        console.log('✅ 上传成功，任务ID:', data.data?.taskId)

      } else {
        const errorMessage = data.error?.message || data.message || '上传失败'
        console.error('❌ 上传失败:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ 上传异常:', error)
      setUploadItems(prev => prev.map((item, i) =>
        i === index ? {
          ...item,
          status: 'failed',
          error: error instanceof Error ? error.message : '上传失败'
        } : item
      ))
    }
  }

  // 取消上传
  const cancelUpload = (index: number) => {
    const item = uploadItems[index]
    if (!item) return

    if (item.taskId) {
      // 如果有任务ID，调用取消API
      fetch(`/api/v1/media/upload-cancel/${item.taskId}`, {
        method: 'POST'
      }).catch(console.error)
    }

    setUploadItems(prev => prev.map((item, i) =>
      i === index ? { ...item, status: 'cancelled' } : item
    ))
  }

  // 移除文件
  const removeFile = (index: number) => {
    setUploadItems(prev => prev.filter((_, i) => i !== index))
  }

  // 处理上传完成
  const handleUploadComplete = (index: number, result: any) => {
    console.log('✅ 上传完成回调:', { index, result })
    setUploadItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        status: 'completed',
        result
      } : item
    ))

    setCompletedUploads(prev => [...prev, result])
  }

  // 处理上传错误
  const handleUploadError = (index: number, error: string) => {
    console.log('❌ 上传错误回调:', { index, error })
    setUploadItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        status: 'failed',
        error
      } : item
    ))
  }

  // 检查上传状态（备用机制）
  const checkUploadStatus = async (taskId: string, index: number) => {
    try {
      const response = await fetch(`/api/v1/media/upload-status/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const task = data.data
          if (task.status === 'completed') {
            handleUploadComplete(index, task.result)
          } else if (task.status === 'failed') {
            handleUploadError(index, task.error || '上传失败')
          }
        }
      }
    } catch (error) {
      console.error('检查上传状态失败:', error)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'uploading':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Upload className="w-5 h-5 text-gray-400" />
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">批量上传文件</h2>
          <div className="flex items-center space-x-2">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="text-gray-400 hover:text-gray-600"
                title="最小化"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="关闭"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 拖拽上传区域 - 始终显示 */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-4 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm font-medium">
                {isDragActive ? '释放文件开始上传' : uploadItems.length === 0 ? '拖拽文件到这里或点击选择' : '继续添加更多文件'}
              </div>
              <div className="text-xs text-gray-500">
                支持图片、视频、音频文件，最大500MB
              </div>
            </div>
          </div>

          {/* 文件列表 */}
          {uploadItems.length > 0 && (
            <div className="space-y-4">
              {uploadItems.map((item, index) => (
                <div key={`${item.file.name}-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="font-medium text-gray-900">{item.file.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(item.file.size)} • {item.file.type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {allowCancel && (item.status === 'uploading' || item.status === 'processing') && (
                        <button
                          onClick={() => cancelUpload(index)}
                          className="text-red-500 hover:text-red-700"
                          title="取消上传"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}

                      {(item.status === 'pending' || item.status === 'failed' || item.status === 'cancelled') && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600"
                          title="移除文件"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 进度条组件 */}
                  {item.taskId && (item.status === 'uploading' || item.status === 'processing') && (
                    <UploadProgress
                      taskId={item.taskId}
                      onComplete={(result) => handleUploadComplete(index, result)}
                      onError={(error) => handleUploadError(index, error)}
                    />
                  )}

                  {/* 错误信息 */}
                  {item.status === 'failed' && item.error && (
                    <div className="mt-2 text-sm text-red-600">
                      错误: {item.error}
                    </div>
                  )}

                  {/* 完成信息 */}
                  {item.status === 'completed' && item.result && (
                    <div className="mt-2 text-sm text-green-600">
                      上传成功！文件已保存
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {uploadItems.length > 0 && (
              <>
                总计 {uploadItems.length} 个文件 •
                已完成 {uploadItems.filter(item => item.status === 'completed').length} •
                失败 {uploadItems.filter(item => item.status === 'failed').length}
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              关闭
            </button>

            {uploadItems.length > 0 && !isUploading && (
              <button
                onClick={startUpload}
                disabled={uploadItems.filter(item => item.status === 'pending').length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                开始上传
              </button>
            )}

            {completedUploads.length > 0 && (
              <button
                onClick={() => {
                  onUploadComplete(completedUploads)
                  onClose()
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                完成 ({completedUploads.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

EnhancedBatchUpload.displayName = 'EnhancedBatchUpload'

export default EnhancedBatchUpload
