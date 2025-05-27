import { useState } from 'react'
import Head from 'next/head'
import UploadProgress from '@/components/ui/UploadProgress'

export default function UploadProgressTest() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setTaskId(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('请选择文件')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)
    setTaskId(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)
      formData.append('description', '测试上传')

      const response = await fetch('/api/v1/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setTaskId(data.data?.taskId)
        // 不立即设置result，等待进度组件完成
      } else {
        setError(data.error?.message || '上传失败')
        setUploading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
      setUploading(false)
    }
  }

  const handleUploadComplete = (uploadResult: any) => {
    setResult(uploadResult)
    setUploading(false)
    console.log('上传完成:', uploadResult)
  }

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage)
    setUploading(false)
    setTaskId(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Head>
        <title>文件上传进度测试</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">文件上传进度测试</h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择文件
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>

            {file && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">文件信息</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>文件名: {file.name}</div>
                  <div>文件大小: {formatFileSize(file.size)}</div>
                  <div>文件类型: {file.type}</div>
                  <div>最后修改: {new Date(file.lastModified).toLocaleString()}</div>
                </div>

                {/* 文件大小检查 */}
                <div className="mt-3">
                  {file.size > 500 * 1024 * 1024 ? (
                    <div className="text-red-600 text-sm">
                      ⚠️ 文件大小超过500MB限制
                    </div>
                  ) : file.size > 100 * 1024 * 1024 ? (
                    <div className="text-yellow-600 text-sm">
                      ⚠️ 文件较大，预计处理时间1-3分钟
                    </div>
                  ) : (
                    <div className="text-green-600 text-sm">
                      ✅ 文件大小合适，预计处理时间30-90秒
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : '开始上传'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">上传失败</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* 进度条组件 */}
          {taskId && (
            <div className="mb-6">
              <UploadProgress
                taskId={taskId}
                onComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </div>
          )}

          {/* 上传结果 */}
          {result && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-medium text-green-800 mb-4">上传成功</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div>文件ID: {result.id}</div>
                <div>文件UUID: {result.uuid}</div>
                <div>文件类型: {result.type}</div>
                <div>文件大小: {result.fileSize ? formatFileSize(result.fileSize) : 'N/A'}</div>
                <div>MIME类型: {result.mimeType}</div>
                {result.width && result.height && (
                  <div>尺寸: {result.width} × {result.height}</div>
                )}
                {result.duration && (
                  <div>时长: {result.duration.toFixed(2)}秒</div>
                )}
                <div>URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{result.url}</a></div>
              </div>

              {/* 预览 */}
              {result.url && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">预览</h4>
                  {result.type === 'IMAGE' && (
                    <img 
                      src={result.url} 
                      alt={result.title}
                      className="max-w-full h-auto max-h-64 rounded border"
                    />
                  )}
                  {result.type === 'VIDEO' && (
                    <video 
                      src={result.url}
                      controls
                      className="max-w-full h-auto max-h-64 rounded border"
                    >
                      您的浏览器不支持视频播放
                    </video>
                  )}
                  {result.type === 'AUDIO' && (
                    <audio 
                      src={result.url}
                      controls
                      className="w-full"
                    >
                      您的浏览器不支持音频播放
                    </audio>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 功能说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">新功能特性</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>✨ 实时进度显示：上传、处理、保存各阶段进度</div>
              <div>⚡ 后台处理：上传后可关闭页面，处理在后台继续</div>
              <div>🕒 时间预估：显示预计剩余处理时间</div>
              <div>📊 状态可视化：不同阶段使用不同颜色和图标</div>
              <div>🔄 自动重连：网络断开时自动重新连接进度推送</div>
              <div>⏰ 超时保护：3分钟超时自动终止处理</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
