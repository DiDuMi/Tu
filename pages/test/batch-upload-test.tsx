import React, { useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import UploadManager from '@/components/content/UploadManager'

interface BatchUploadTestPageProps {
  user: {
    id: number
    name: string
    email: string
  }
}

export default function BatchUploadTestPage({ user }: BatchUploadTestPageProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadResults, setUploadResults] = useState<any[]>([])

  const handleUploadComplete = (mediaList: any[]) => {
    console.log('✅ 批量上传完成:', mediaList)
    setUploadResults(prev => [...prev, ...mediaList])
    setIsUploadOpen(false)
  }

  const clearResults = () => {
    setUploadResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">批量上传功能测试</h1>
          
          <div className="space-y-6">
            {/* 用户信息 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="font-medium text-blue-900 mb-2">当前用户信息</h2>
              <p className="text-blue-800">
                用户: {user.name} ({user.email})
              </p>
            </div>

            {/* 测试按钮 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">测试功能</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🚀 打开批量上传
                </button>
                
                <button
                  onClick={() => {
                    console.log('🔍 当前上传结果:', uploadResults)
                    alert(`已上传 ${uploadResults.length} 个文件，请查看控制台`)
                  }}
                  className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📊 查看上传结果
                </button>

                <button
                  onClick={clearResults}
                  className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ 清空结果
                </button>
              </div>
            </div>

            {/* 测试说明 */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">🧪 测试说明</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• 点击"打开批量上传"测试上传功能</li>
                <li>• 拖拽文件到上传区域测试拖拽功能</li>
                <li>• 添加文件后，继续拖拽测试多次添加功能</li>
                <li>• 查看浏览器控制台获取详细日志</li>
                <li>• 测试不同文件类型（图片、视频、音频）</li>
                <li>• 测试大文件上传和进度显示</li>
              </ul>
            </div>

            {/* 上传结果显示 */}
            {uploadResults.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-4">✅ 上传成功的文件 ({uploadResults.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadResults.map((media, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-gray-900 truncate">{media.title}</div>
                        <div className="text-gray-600">类型: {media.type}</div>
                        <div className="text-gray-600">
                          大小: {media.fileSize ? (media.fileSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}
                        </div>
                        {media.width && media.height && (
                          <div className="text-gray-600">尺寸: {media.width}×{media.height}</div>
                        )}
                        {media.duration && (
                          <div className="text-gray-600">时长: {media.duration.toFixed(1)}s</div>
                        )}
                        <div className="text-xs text-gray-500">ID: {media.id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 功能特性说明 */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">🎯 功能特性</h3>
              <div className="text-purple-800 text-sm space-y-1">
                <div>✅ 拖拽上传 - 支持多文件拖拽</div>
                <div>✅ 继续添加 - 可在已有文件基础上继续添加</div>
                <div>✅ 实时进度 - SSE实时进度推送</div>
                <div>✅ 并发控制 - 限制同时上传数量</div>
                <div>✅ 错误处理 - 详细的错误信息显示</div>
                <div>✅ 取消上传 - 支持取消正在进行的上传</div>
                <div>✅ 最小化界面 - 可最小化到浮动窗口</div>
                <div>✅ 页面保护 - 上传中离开页面提醒</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 上传管理器 */}
      <UploadManager
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
        allowCancel={true}
        allowPause={false}
        maxConcurrent={2}
      />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    },
  }
}
