import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Upload, Cog, Save } from 'lucide-react'

interface UploadProgressProps {
  taskId: string
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

interface ProgressData {
  taskId: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  stage: 'upload' | 'processing' | 'saving' | 'completed'
  filename: string
  fileSize?: number
  estimatedTime?: number
  error?: string
  result?: any
}

export default function UploadProgress({ taskId, onComplete, onError }: UploadProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    taskId,
    status: 'pending',
    progress: 0,
    stage: 'upload',
    filename: '上传中...'
  })
  const [isConnected, setIsConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  // 轮询机制作为SSE的备用方案
  const startPolling = () => {
    if (isPolling) return
    setIsPolling(true)
    console.log('🔄 启动轮询机制检查上传状态...')

    const pollInterval = setInterval(async () => {
      try {
        console.log(`🔄 轮询检查任务状态: ${taskId}`)
        const response = await fetch(`/api/v1/media/upload-status/${taskId}`)
        console.log(`📡 轮询响应状态: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log(`📊 轮询获取数据:`, data)

          if (data.success) {
            const taskData = data.data
            console.log(`✅ 任务状态更新:`, taskData)

            setProgress(prev => ({
              ...prev,
              status: taskData.status,
              progress: taskData.progress,
              stage: taskData.stage,
              filename: taskData.filename
            }))

            if (taskData.status === 'completed') {
              console.log(`🎉 任务完成，调用回调`)
              onComplete?.(taskData.result)
              clearInterval(pollInterval)
              setIsPolling(false)
            } else if (taskData.status === 'failed') {
              console.log(`❌ 任务失败:`, taskData.error)
              onError?.(taskData.error || '上传失败')
              clearInterval(pollInterval)
              setIsPolling(false)
            }
          } else {
            console.log(`⚠️ 轮询响应不成功:`, data)
          }
        } else {
          console.log(`❌ 轮询请求失败: ${response.status}`)
        }
      } catch (error) {
        console.error('轮询检查失败:', error)
      }
    }, 2000) // 每2秒检查一次

    // 30秒后停止轮询
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }, 30000)
  }

  // 最终状态检查
  const checkFinalStatus = async () => {
    try {
      const response = await fetch(`/api/v1/media/upload-status/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const taskData = data.data
          console.log('🔍 最终状态检查结果:', taskData)

          setProgress(prev => ({
            ...prev,
            status: taskData.status,
            progress: taskData.progress,
            stage: taskData.stage,
            filename: taskData.filename
          }))

          if (taskData.status === 'completed') {
            onComplete?.(taskData.result)
          } else if (taskData.status === 'failed') {
            onError?.(taskData.error || '上传失败')
          }
        }
      }
    } catch (error) {
      console.error('最终状态检查失败:', error)
    }
  }

  useEffect(() => {
    if (!taskId) return

    console.log(`🚀 开始监控任务: ${taskId}`)

    // 直接启动轮询机制，不依赖SSE
    startPolling()

    return () => {
      setIsConnected(false)
      setIsPolling(false)
    }
  }, [taskId, onComplete, onError])

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'upload':
        return <Upload className="w-5 h-5 text-blue-500" />
      case 'processing':
        return <Cog className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'saving':
        return <Save className="w-5 h-5 text-green-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Upload className="w-5 h-5 text-gray-500" />
    }
  }

  const getStageText = () => {
    switch (progress.stage) {
      case 'upload':
        return '上传文件'
      case 'processing':
        return '处理中'
      case 'saving':
        return '保存中'
      case 'completed':
        return '完成'
      default:
        return '准备中'
    }
  }

  const getProgressColor = () => {
    if (progress.status === 'failed') return 'bg-red-500'
    if (progress.status === 'completed') return 'bg-green-500'
    if (progress.stage === 'processing') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStageIcon()}
          <div>
            <h3 className="font-medium text-gray-900">{progress.filename}</h3>
            <p className="text-sm text-gray-500">{getStageText()}</p>
          </div>
        </div>

        {progress.status === 'failed' && (
          <XCircle className="w-6 h-6 text-red-500" />
        )}

        {isPolling && progress.status !== 'completed' && progress.status !== 'failed' && (
          <div className="text-xs text-blue-600">检查中...</div>
        )}
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{progress.progress.toFixed(0)}%</span>
          {progress.estimatedTime && progress.status === 'processing' && (
            <span>预计剩余: {formatTime(progress.estimatedTime)}</span>
          )}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* 状态信息 */}
      {progress.status === 'failed' && progress.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">
            <strong>上传失败：</strong>{progress.error}
          </p>
        </div>
      )}

      {progress.status === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">
            <strong>上传成功！</strong>文件已处理完成
          </p>
        </div>
      )}

      {progress.fileSize && (
        <div className="text-xs text-gray-500 mt-2">
          文件大小: {(progress.fileSize / 1024 / 1024).toFixed(2)} MB
        </div>
      )}
    </div>
  )
}
