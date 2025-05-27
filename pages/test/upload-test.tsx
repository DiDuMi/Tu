import { useState } from 'react'
import Head from 'next/head'

export default function UploadTest() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
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
        setResult(data)
      } else {
        setError(data.error?.message || '上传失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
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
        <title>文件上传测试</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">文件上传测试</h1>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择文件
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                      ⚠️ 文件较大，建议压缩后上传
                    </div>
                  ) : (
                    <div className="text-green-600 text-sm">
                      ✅ 文件大小合适
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

            {result && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">上传成功</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>文件ID: {result.data?.id}</div>
                  <div>文件UUID: {result.data?.uuid}</div>
                  <div>文件类型: {result.data?.type}</div>
                  <div>文件大小: {result.data?.fileSize ? formatFileSize(result.data.fileSize) : 'N/A'}</div>
                  <div>MIME类型: {result.data?.mimeType}</div>
                  {result.data?.width && result.data?.height && (
                    <div>尺寸: {result.data.width} × {result.data.height}</div>
                  )}
                  {result.data?.duration && (
                    <div>时长: {result.data.duration.toFixed(2)}秒</div>
                  )}
                  <div>URL: <a href={result.data?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{result.data?.url}</a></div>
                </div>

                {/* 预览 */}
                {result.data?.url && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-800 mb-2">预览</h4>
                    {result.data.type === 'IMAGE' && (
                      <img 
                        src={result.data.url} 
                        alt={result.data.title}
                        className="max-w-full h-auto max-h-64 rounded border"
                      />
                    )}
                    {result.data.type === 'VIDEO' && (
                      <video 
                        src={result.data.url}
                        controls
                        className="max-w-full h-auto max-h-64 rounded border"
                      >
                        您的浏览器不支持视频播放
                      </video>
                    )}
                    {result.data.type === 'AUDIO' && (
                      <audio 
                        src={result.data.url}
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
          </div>

          {/* 上传限制说明 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">上传限制说明</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• 最大文件大小: 500MB</div>
              <div>• 推荐文件大小: 100MB以内</div>
              <div>• 支持格式: 图片(JPG, PNG, GIF, WebP)、视频(MP4, AVI, MOV, WMV, WebM, FLV, 3GP)、音频(MP3, WAV, AAC, OGG)</div>
              <div>• 视频建议: 使用MP4格式，H.264编码，1080p或720p分辨率</div>
              <div>• 图片建议: 使用JPG或PNG格式，分辨率不超过4K</div>
            </div>
          </div>

          {/* 压缩建议 */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">文件压缩建议</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>• 视频压缩: 使用HandBrake、FFmpeg或在线压缩工具</div>
              <div>• 图片压缩: 使用TinyPNG、Squoosh或Photoshop</div>
              <div>• 音频压缩: 使用Audacity或在线音频压缩工具</div>
              <div>• 推荐比特率: 视频1-4Mbps，音频128-320kbps</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
