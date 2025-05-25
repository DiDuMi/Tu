import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { fetcher } from '@/lib/api';

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

interface MediaSelectorProps {
  selectedMedia?: MediaItem[]
  onMediaSelect: (media: MediaItem[]) => void
  maxSelection?: number
  allowedTypes?: string[]
}

export default function MediaSelector({
  selectedMedia = [],
  onMediaSelect,
  maxSelection = 9,
  allowedTypes = ['IMAGE', 'VIDEO']
}: MediaSelectorProps) {

  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>(selectedMedia)

  // 加载媒体列表
  const loadMedia = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        type: allowedTypes.join(','),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetcher(`/api/v1/media?${params}`)
      if (response.success) {
        setMediaItems(response.data.items || [])
      } else {
        setError('加载媒体失败')
      }
    } catch (err) {
      console.error('加载媒体时出错:', err)
      setError('加载媒体时发生错误')
    } finally {
      setLoading(false)
    }
  }

  // 打开对话框时加载媒体
  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen, searchTerm])

  // 处理媒体选择
  const handleMediaToggle = (media: MediaItem) => {
    const isSelected = selectedItems.some(item => item.uuid === media.uuid)

    if (isSelected) {
      const newSelection = selectedItems.filter(item => item.uuid !== media.uuid)
      setSelectedItems(newSelection)
    } else {
      if (selectedItems.length < maxSelection) {
        const newSelection = [...selectedItems, media]
        setSelectedItems(newSelection)
      }
    }
  }

  // 确认选择
  const handleConfirm = () => {
    onMediaSelect(selectedItems)
    setIsOpen(false)
  }

  // 取消选择
  const handleCancel = () => {
    setSelectedItems(selectedMedia)
    setIsOpen(false)
  }

  return (
    <div>
      {/* 触发按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        {selectedItems.length > 0
          ? `已选择 ${selectedItems.length} 个媒体`
          : '选择媒体'}
      </Button>

      {/* 媒体选择对话框 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">选择媒体</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  ✕
                </Button>
              </div>

              {/* 搜索框 */}
              <Input
                placeholder="搜索媒体..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">加载中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMedia}
                    className="mt-2"
                  >
                    重试
                  </Button>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无媒体</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaItems.map((media) => {
                    const isSelected = selectedItems.some(item => item.uuid === media.uuid)

                    return (
                      <Card
                        key={media.uuid}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary-500' : ''
                        }`}
                        onClick={() => handleMediaToggle(media)}
                      >
                        <CardContent className="p-2">
                          <div className="relative aspect-square rounded overflow-hidden">
                            <img
                              src={media.url}
                              alt={media.title || '媒体'}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                ✓
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 truncate">
                              {media.title || '未命名'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  已选择 {selectedItems.length}/{maxSelection} 个媒体
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirm}
                >
                  确认选择
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
