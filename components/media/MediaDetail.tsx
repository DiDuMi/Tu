import React, { useState } from 'react'
import { MediaResponse } from '@/types/api'
import { formatFileSize } from '@/lib/upload'
import { useRouter } from 'next/router'
import MediaEditForm from './MediaEditForm'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import Link from 'next/link'
import { Tab } from '@headlessui/react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { VideoPlayer } from '@/components/ui/AdvancedVideo'

interface MediaDetailProps {
  media: MediaResponse
  onUpdate?: (updatedMedia: MediaResponse) => void
  className?: string
}

const MediaDetail: React.FC<MediaDetailProps> = ({ media, onUpdate, className = '' }) => {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(media.title || '')
  const [description, setDescription] = useState(media.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isImage = media.type === 'IMAGE'
  const isVideo = media.type === 'VIDEO'
  const isAudio = media.type === 'AUDIO'
  const isCloudVideo = media.type === 'CLOUD_VIDEO'

  // 获取分类和标签数据（用于编辑表单）
  const { data: categories } = useSWR('/api/v1/media/categories', fetcher)
  const { data: tags } = useSWR('/api/v1/media/tags', fetcher)

  // 标签页状态
  const [activeTab, setActiveTab] = useState(0)

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // 处理表单提交
  const handleSubmit = async (data: { title: string; description: string }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/media/${media.uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error?.message || '更新媒体信息失败')
      }

      setIsEditing(false)
      if (onUpdate) {
        onUpdate(responseData.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新媒体信息失败')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/media/${media.uuid}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '删除媒体失败')
      }

      // 删除成功后返回媒体列表页
      router.push('/admin/media')
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除媒体失败')
      setIsDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // 复制URL到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('已复制到剪贴板')
      })
      .catch((err) => {
        console.error('复制失败:', err)
      })
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* 媒体预览 */}
      <div className="bg-gray-100 flex justify-center items-center p-4">
        {isImage && (
          <img
            src={media.url}
            alt={media.title || '图片'}
            className="max-w-full max-h-[500px] object-contain"
          />
        )}
        {isVideo && (
          <VideoPlayer
            src={media.url}
            poster={media.thumbnailUrl}
            enableLazyLoading={true}
            autoOptimizeFormat={true}
            compressionQuality="auto"
            containerClassName="max-w-full max-h-[500px]"
          />
        )}
        {isAudio && (
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
              {media.thumbnailUrl ? (
                <img
                  src={media.thumbnailUrl}
                  alt="音频缩略图"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
            </div>
            <p className="text-lg font-medium mb-4">{media.title || '音频文件'}</p>
            <audio
              src={media.url}
              controls
              className="w-full"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
        {isCloudVideo && (
          <div className="w-full aspect-w-16 aspect-h-9">
            <iframe
              src={media.url}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        )}
      </div>

      {/* 媒体信息 */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {isEditing ? (
          <MediaEditForm
            media={media}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-xl font-semibold text-gray-900">{media.title}</h1>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </div>
            </div>

            {media.description && (
              <p className="text-gray-700 mb-6">{media.description}</p>
            )}

            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                    }`
                  }
                >
                  基本信息
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                    }`
                  }
                >
                  使用情况
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                    }`
                  }
                >
                  版本历史
                </Tab>
              </Tab.List>
              <Tab.Panels>
                {/* 基本信息面板 */}
                <Tab.Panel className="rounded-xl bg-white p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-2">媒体信息</h2>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">类型:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              media.type === 'IMAGE' ? 'bg-green-100 text-green-800' :
                              media.type === 'VIDEO' ? 'bg-blue-100 text-blue-800' :
                              media.type === 'AUDIO' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {media.type === 'IMAGE' ? '图片' :
                               media.type === 'VIDEO' ? '视频' :
                               media.type === 'AUDIO' ? '音频' :
                               '云媒体'}
                            </span>
                          </dd>
                        </div>
                        {media.fileSize && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">文件大小:</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatFileSize(media.fileSize)}</dd>
                          </div>
                        )}
                        {media.width && media.height && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">尺寸:</dt>
                            <dd className="text-sm font-medium text-gray-900">{media.width} × {media.height}</dd>
                          </div>
                        )}
                        {media.mimeType && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">MIME类型:</dt>
                            <dd className="text-sm font-medium text-gray-900">{media.mimeType}</dd>
                          </div>
                        )}
                        {media.duration && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">时长:</dt>
                            <dd className="text-sm font-medium text-gray-900">{Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</dd>
                          </div>
                        )}
                        {media.status && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">状态:</dt>
                            <dd className="text-sm font-medium text-gray-900">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                media.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                media.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {media.status === 'ACTIVE' ? '正常' :
                                 media.status === 'PROCESSING' ? '处理中' :
                                 '错误'}
                              </span>
                            </dd>
                          </div>
                        )}
                      </dl>

                      {/* 分类和标签 */}
                      <h2 className="text-sm font-medium text-gray-500 mb-2 mt-6">分类与标签</h2>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">分类:</dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {media.category ? (
                              <Link href={`/admin/media?categoryId=${media.category.id}`} className="text-blue-600 hover:text-blue-800">
                                {media.category.name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">未分类</span>
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">标签:</dt>
                          <dd className="text-sm font-medium text-gray-900 flex flex-wrap justify-end gap-1">
                            {media.tags && media.tags.length > 0 ? (
                              media.tags.map(tag => (
                                <Link
                                  key={tag.id}
                                  href={`/admin/media?tagIds=${tag.id}`}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                                >
                                  {tag.color && (
                                    <span
                                      className="w-2 h-2 rounded-full mr-1"
                                      style={{ backgroundColor: tag.color }}
                                    />
                                  )}
                                  {tag.name}
                                </Link>
                              ))
                            ) : (
                              <span className="text-gray-400">无标签</span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-500 mb-2">元数据</h2>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">ID:</dt>
                          <dd className="text-sm font-medium text-gray-900">{media.uuid}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">上传时间:</dt>
                          <dd className="text-sm font-medium text-gray-900">{formatDate(media.createdAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">更新时间:</dt>
                          <dd className="text-sm font-medium text-gray-900">{formatDate(media.updatedAt)}</dd>
                        </div>
                        {media.user && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600">上传者:</dt>
                            <dd className="text-sm font-medium text-gray-900">{media.user.name}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">存储类型:</dt>
                          <dd className="text-sm font-medium text-gray-900">{media.storageType === 'LOCAL' ? '本地存储' : '云存储'}</dd>
                        </div>
                      </dl>

                      <h2 className="text-sm font-medium text-gray-500 mb-2 mt-6">媒体URL</h2>
                      <div className="flex items-center mb-2">
                        <input
                          type="text"
                          value={media.url}
                          readOnly
                          className="flex-1 rounded-l-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(media.url)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          复制
                        </button>
                      </div>

                      {media.thumbnailUrl && (
                        <>
                          <h2 className="text-sm font-medium text-gray-500 mb-2 mt-4">缩略图URL</h2>
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={media.thumbnailUrl}
                              readOnly
                              className="flex-1 rounded-l-md border-gray-300 bg-gray-50 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(media.thumbnailUrl || '')}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              复制
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Tab.Panel>

                {/* 使用情况面板 */}
                <Tab.Panel className="rounded-xl bg-white p-3">
                  <div className="mb-6">
                    <h2 className="text-sm font-medium text-gray-500 mb-2">使用统计</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">{media.usageCount || 0}</p>
                          <p className="text-sm text-gray-500">总使用次数</p>
                        </div>
                      </div>

                      {/* 这里可以添加更多使用统计信息，如使用位置、引用页面等 */}
                      <div className="mt-6">
                        <p className="text-sm text-gray-500 text-center">
                          {media.usageCount ? '此媒体已被使用' : '此媒体尚未被使用'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* 版本历史面板 */}
                <Tab.Panel className="rounded-xl bg-white p-3">
                  <div className="mb-6">
                    <h2 className="text-sm font-medium text-gray-500 mb-2">版本历史</h2>
                    {media.versions && media.versions.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">版本</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新者</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">变更说明</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {media.versions.map((version) => (
                              <tr key={version.uuid}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">v{version.versionNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(version.createdAt)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{version.user?.name || '未知'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{version.changeNote || '无'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <a href={version.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">查看</a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">暂无版本历史记录</p>
                      </div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </>
        )}
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={isDeleteModalOpen}
        title="确认删除"
        message="您确定要删除此媒体吗？此操作无法撤销。"
        confirmButtonText="删除"
        cancelButtonText="取消"
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  )
}

export default MediaDetail
