import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { fetcher } from '@/lib/api'
import { extractFirstImageFromContent, validateImageUrl, generateThumbnailUrl } from '@/lib/cover-image-utils'
import ImagePreview from './ImagePreview'

interface MediaItem {
  id: number
  uuid: string
  title: string
  url: string
  type: string
  mimeType?: string
  width?: number
  height?: number
}

interface EditorMediaItem {
  id: string
  element: HTMLElement
  preview: string
  type: 'image' | 'video' | 'document'
  title: string
  originalIndex: number
}

interface CoverImageSelectorProps {
  currentCover?: string
  onCoverSelect: (coverUrl: string) => void
  editorContent?: string
  className?: string
}

export default function CoverImageSelector({
  currentCover,
  onCoverSelect,
  editorContent,
  className = ''
}: CoverImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'media' | 'editor' | 'url' | 'recent'>('media')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [editorImages, setEditorImages] = useState<EditorMediaItem[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [urlValidating, setUrlValidating] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [recentCovers, setRecentCovers] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载最近使用的封面
  useEffect(() => {
    const saved = localStorage.getItem('recent-covers')
    if (saved) {
      try {
        setRecentCovers(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load recent covers:', e)
      }
    }
  }, [])

  // 保存最近使用的封面
  const saveRecentCover = useCallback((coverUrl: string) => {
    if (!coverUrl) return

    setRecentCovers(prev => {
      const updated = [coverUrl, ...prev.filter(url => url !== coverUrl)].slice(0, 10)
      localStorage.setItem('recent-covers', JSON.stringify(updated))
      return updated
    })
  }, [])

  // 加载媒体库中的图片
  const loadMediaImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetcher('/api/v1/media?type=IMAGE&limit=50')
      const items = response.data?.items || []
      setMediaItems(items.filter((item: MediaItem) => item.type === 'IMAGE'))
    } catch (err) {
      setError('加载媒体失败')
      console.error('加载媒体失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 从编辑器内容中提取图片
  const extractEditorImages = () => {
    if (!editorContent) {
      setEditorImages([])
      return
    }

    try {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = editorContent

      const images = tempDiv.querySelectorAll('img')
      const editorImageItems: EditorMediaItem[] = []

      images.forEach((img, index) => {
        if (img.src) {
          editorImageItems.push({
            id: `editor-img-${index}`,
            element: img,
            preview: img.src,
            type: 'image',
            title: img.alt || `编辑器图片 ${index + 1}`,
            originalIndex: index
          })
        }
      })

      setEditorImages(editorImageItems)
    } catch (err) {
      console.error('提取编辑器图片失败:', err)
      setEditorImages([])
    }
  }

  // 打开对话框时加载数据
  useEffect(() => {
    if (isOpen) {
      loadMediaImages()
      extractEditorImages()
    }
  }, [isOpen, editorContent])

  // 键盘快捷键支持
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      } else if (e.key === 'Enter' && activeTab === 'url' && urlInput.trim()) {
        e.preventDefault()
        handleUrlSubmit()
      } else if (e.key >= '1' && e.key <= '4') {
        const tabIndex = parseInt(e.key) - 1
        const tabs: ('media' | 'editor' | 'url' | 'recent')[] = ['media', 'editor', 'url']
        if (recentCovers.length > 0) tabs.push('recent')
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeTab, urlInput, recentCovers.length])

  // 过滤媒体项
  const filteredMediaItems = mediaItems.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.uuid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 过滤编辑器图片
  const filteredEditorImages = editorImages.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 验证URL
  const validateUrl = async (url: string) => {
    if (!url.trim()) {
      setUrlError('请输入图片URL')
      return false
    }

    setUrlValidating(true)
    setUrlError(null)

    try {
      const isValid = await validateImageUrl(url)
      if (!isValid) {
        setUrlError('无效的图片URL或图片无法加载')
        return false
      }
      return true
    } catch (error) {
      setUrlError('验证图片URL时出错')
      return false
    } finally {
      setUrlValidating(false)
    }
  }

  // 处理URL输入
  const handleUrlSubmit = async () => {
    const isValid = await validateUrl(urlInput)
    if (isValid) {
      handleCoverSelect(urlInput)
      setUrlInput('')
    }
  }

  // 处理文件上传
  const handleFileUpload = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'IMAGE')

      const response = await fetch('/api/v1/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          handleCoverSelect(result.data.url)
          // 重新加载媒体列表
          loadMediaImages()
        } else {
          setError('上传失败')
        }
      } else {
        setError('上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      setError('上传时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // 处理封面选择
  const handleCoverSelect = (imageUrl: string) => {
    onCoverSelect(imageUrl)
    // 保存URL到最近使用
    saveRecentCover(imageUrl)
    setIsOpen(false)
  }

  // 自动提取封面
  const handleAutoExtract = () => {
    if (editorContent) {
      const firstImage = extractFirstImageFromContent(editorContent)
      if (firstImage) {
        onCoverSelect(firstImage)
        saveRecentCover(firstImage)
        setIsOpen(false)
      }
    }
  }

  return (
    <div className={className}>
      {/* 当前封面预览 */}
      {currentCover && (
        <div className="mb-4">
          <Label className="text-sm text-green-600 font-medium">当前封面</Label>
          <div className="mt-2 relative w-48 h-32 rounded-lg overflow-hidden border-2 border-green-200 shadow-sm">
            <ImagePreview
              src={currentCover}
              alt="封面预览"
              showInfo={true}
              className="w-full h-full"
            />
            <button
              type="button"
              onClick={() => onCoverSelect('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg"
              title="移除封面"
            >
              ×
            </button>
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow">
              当前封面
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            点击右上角 × 可移除封面
          </p>
        </div>
      )}

      {/* 选择封面按钮 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('更换封面按钮被点击')
            setIsOpen(true)
          }}
          className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {currentCover ? '更换封面' : '选择封面'}
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="whitespace-nowrap"
        >
          上传图片
        </Button>
        {editorContent && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoExtract}
            className="whitespace-nowrap"
          >
            自动提取
          </Button>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* 封面选择对话框 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">选择封面图片</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </Button>
              </div>

              {/* 标签页切换 */}
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'media'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  媒体库 ({filteredMediaItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'editor'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  编辑器图片 ({filteredEditorImages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'url'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  URL链接
                </button>
                {recentCovers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'recent'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    最近使用 ({recentCovers.length})
                  </button>
                )}
              </div>

              {/* 搜索框 */}
              <Input
                placeholder="搜索图片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div
              className={`p-6 overflow-y-auto max-h-96 ${
                dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {activeTab === 'url' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url-input">图片URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="url-input"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="输入图片URL，例如：https://example.com/image.jpg"
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                      />
                      <Button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim() || urlValidating}
                        className="whitespace-nowrap"
                      >
                        {urlValidating ? '验证中...' : '添加'}
                      </Button>
                    </div>
                    {urlError && (
                      <p className="mt-1 text-sm text-red-500">{urlError}</p>
                    )}
                  </div>

                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p>输入图片URL地址</p>
                    <p className="text-sm">支持 JPG、PNG、GIF、WebP 格式</p>
                  </div>
                </div>
              ) : activeTab === 'recent' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {recentCovers.map((coverUrl, index) => {
                    // 直接使用原始URL
                    const displayUrl = coverUrl

                    return (
                      <Card
                        key={`${index}-${coverUrl}`}
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onClick={() => handleCoverSelect(displayUrl)}
                      >
                        <CardContent className="p-2">
                          <div className="relative aspect-square rounded overflow-hidden">
                            <ImagePreview
                              src={displayUrl}
                              alt={`最近使用 ${index + 1}`}
                              showInfo={true}
                              className="w-full h-full"
                            />
                            {(currentCover === coverUrl || currentCover === displayUrl) && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">
                                ✓
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-1 rounded shadow">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-purple-500 font-medium">
                              最近使用
                            </p>
                            <p className="text-xs text-gray-400 truncate" title={coverUrl}>
                              {coverUrl.length > 30 ? `${coverUrl.substring(0, 30)}...` : coverUrl}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">加载中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadMediaImages}
                    className="mt-2"
                  >
                    重试
                  </Button>
                </div>
              ) : dragOver ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-blue-600">释放以上传图片</p>
                  <p className="text-sm text-blue-500">支持 JPG、PNG、GIF、WebP 格式</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {activeTab === 'media' ? (
                    filteredMediaItems.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">暂无图片</p>
                      </div>
                    ) : (
                      filteredMediaItems.map((media) => (
                        <Card
                          key={media.uuid}
                          className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                          onClick={() => handleCoverSelect(media.url)}
                        >
                          <CardContent className="p-2">
                            <div className="relative aspect-square rounded overflow-hidden">
                              <ImagePreview
                                src={generateThumbnailUrl(media.url, 200, 200)}
                                alt={media.title || '媒体'}
                                showInfo={true}
                                className="w-full h-full"
                              />
                              {currentCover === media.url && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">
                                  ✓
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 truncate font-medium">
                                {media.title || '未命名'}
                              </p>
                              {media.mimeType && (
                                <p className="text-xs text-gray-400 uppercase">
                                  {media.mimeType.split('/')[1]}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )
                  ) : (
                    filteredEditorImages.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <p className="text-gray-500">编辑器中暂无图片</p>
                      </div>
                    ) : (
                      filteredEditorImages.map((image) => (
                        <Card
                          key={image.id}
                          className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                          onClick={() => handleCoverSelect(image.preview)}
                        >
                          <CardContent className="p-2">
                            <div className="relative aspect-square rounded overflow-hidden">
                              <ImagePreview
                                src={image.preview}
                                alt={image.title}
                                showInfo={true}
                                className="w-full h-full"
                              />
                              {currentCover === image.preview && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">
                                  ✓
                                </div>
                              )}
                              <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded shadow">
                                #{image.originalIndex + 1}
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 truncate font-medium">
                                {image.title}
                              </p>
                              <p className="text-xs text-blue-500">
                                编辑器图片
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'media'
                      ? `媒体库中共有 ${filteredMediaItems.length} 张图片`
                      : activeTab === 'editor'
                      ? `编辑器中共有 ${filteredEditorImages.length} 张图片`
                      : activeTab === 'recent'
                      ? `最近使用了 ${recentCovers.length} 张封面`
                      : '通过URL添加图片'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    快捷键：ESC 关闭 | 1-4 切换标签页 | Enter 确认URL
                  </p>
                </div>
                <div className="flex gap-2">
                  {activeTab !== 'url' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      上传图片
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    取消 (ESC)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
