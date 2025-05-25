import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/Button'
import { TrashIcon, ArrowUturnLeftIcon, EyeIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline'

// 媒体项接口
interface MediaItem {
  id: string
  element: HTMLElement
  preview: string
  type: 'image' | 'video' | 'audio' | 'document'
  title: string
  originalIndex: number
}

// 可排序媒体项组件
interface SortableMediaItemProps {
  media: MediaItem
  onDelete: (id: string) => void
  onPreview: (media: MediaItem) => void
}

const SortableMediaItem: React.FC<SortableMediaItemProps> = ({ media, onDelete, onPreview }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative bg-white border-2 border-gray-200 rounded-lg p-3 cursor-move
        hover:border-blue-300 hover:shadow-md transition-all duration-200
        ${isDragging ? 'shadow-lg border-blue-400' : ''}
      `}
    >
      {/* 删除按钮 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(media.id)
        }}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
        title="删除媒体"
      >
        <TrashIcon className="w-3 h-3" />
      </button>

      {/* 预览按钮 */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPreview(media)
        }}
        className="absolute top-1 left-1 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors z-10"
        title="预览媒体"
      >
        <EyeIcon className="w-3 h-3" />
      </button>

      {/* 媒体预览 */}
      <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
        {media.type === 'image' ? (
          <img
            src={media.preview}
            alt={media.title}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="text-center text-gray-500">
            <div className="text-xs font-medium">{media.type.toUpperCase()}</div>
            <div className="text-xs mt-1">媒体文件</div>
          </div>
        )}
      </div>

      {/* 媒体信息 */}
      <div className="text-xs">
        <div className="font-medium text-gray-900 truncate" title={media.title}>
          {media.title}
        </div>
        <div className="text-gray-500 mt-1">
          原位置: {media.originalIndex + 1}
        </div>
      </div>
    </div>
  )
}

// 媒体排序对话框属性
interface MediaSortDialogProps {
  mediaElements: HTMLElement[]
  onApply: (sortedElements: HTMLElement[]) => void
  onCancel: () => void
}

const MediaSortDialog: React.FC<MediaSortDialogProps> = ({
  mediaElements,
  onApply,
  onCancel,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [originalItems, setOriginalItems] = useState<MediaItem[]>([])
  const [deletedItems, setDeletedItems] = useState<MediaItem[]>([])
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 初始化媒体项
  useEffect(() => {
    const items: MediaItem[] = mediaElements.map((el, index) => {
      let preview = ''
      let type: MediaItem['type'] = 'document'
      let title = ''

      if (el.nodeName === 'IMG') {
        preview = (el as HTMLImageElement).src
        type = 'image'
        title = (el as HTMLImageElement).alt || '图片'
      } else if (el.nodeName === 'IFRAME') {
        preview = (el as HTMLIFrameElement).src
        type = 'video'
        title = '云媒体视频'
      } else if (el.classList && el.classList.contains('cloud-video-container')) {
        const iframe = el.querySelector('iframe')
        if (iframe) {
          preview = iframe.src
          type = (el.getAttribute('data-type') as MediaItem['type']) || 'video'
          title = `云媒体 (${type})`
        }
      }

      return {
        id: `media-${index}`,
        element: el,
        preview,
        type,
        title,
        originalIndex: index,
      }
    })

    setMediaItems(items)
    setOriginalItems([...items])
  }, [mediaElements])

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setMediaItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // 删除媒体项
  const handleDelete = (id: string) => {
    const itemToDelete = mediaItems.find(item => item.id === id)
    if (itemToDelete) {
      setDeletedItems(prev => [...prev, itemToDelete])
      setMediaItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // 撤销删除
  const handleUndo = () => {
    if (deletedItems.length > 0) {
      const lastDeleted = deletedItems[deletedItems.length - 1]
      setDeletedItems(prev => prev.slice(0, -1))
      setMediaItems(prev => [...prev, lastDeleted])
    }
  }

  // 重置排序
  const handleReset = () => {
    setMediaItems([...originalItems])
    setDeletedItems([])
  }

  // 应用排序
  const handleApply = () => {
    const sortedElements = mediaItems.map(item => item.element)
    onApply(sortedElements)
  }

  // 预览媒体
  const handlePreview = (media: MediaItem) => {
    setPreviewMedia(media)
  }

  // 检查是否有变化
  const hasChanges = () => {
    if (mediaItems.length !== originalItems.length) return true
    if (deletedItems.length > 0) return true

    return mediaItems.some((item, index) => {
      const originalItem = originalItems[index]
      return !originalItem || item.id !== originalItem.id
    })
  }

  // 切换对比视图
  const toggleComparison = () => {
    setShowComparison(!showComparison)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">媒体内容管理</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                共 {mediaItems.length} 个媒体项
                {deletedItems.length > 0 && (
                  <span className="text-red-600 ml-2">
                    (已删除 {deletedItems.length} 个)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleComparison}
                  className="flex items-center space-x-1"
                >
                  <ArrowsUpDownIcon className="w-4 h-4" />
                  <span>{showComparison ? '隐藏对比' : '排序对比'}</span>
                </Button>
              )}
              {deletedItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  className="flex items-center space-x-1"
                >
                  <ArrowUturnLeftIcon className="w-4 h-4" />
                  <span>撤销删除</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                重置排序
              </Button>
            </div>
          </div>
        </div>

        {/* 媒体网格 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {mediaItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-lg mb-2">请先在编辑器中添加内容</div>
              <div className="text-sm">支持图片、视频等媒体文件</div>
            </div>
          ) : showComparison ? (
            // 对比视图
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 原始排序 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                    原始排序
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {originalItems.map((media, index) => (
                      <div key={`original-${media.id}`} className="relative bg-gray-50 border border-gray-200 rounded-lg p-2">
                        <div className="absolute top-1 left-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center overflow-hidden">
                          {media.type === 'image' ? (
                            <img
                              src={media.preview}
                              alt={media.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <div className="text-xs">{media.type.toUpperCase()}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{media.title}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 新排序 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    新排序
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {mediaItems.map((media, index) => (
                      <div key={`new-${media.id}`} className="relative bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center overflow-hidden">
                          {media.type === 'image' ? (
                            <img
                              src={media.preview}
                              alt={media.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <div className="text-xs">{media.type.toUpperCase()}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{media.title}</div>
                        {media.originalIndex !== index && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            !
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {deletedItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-red-600 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    已删除的媒体
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {deletedItems.map((media) => (
                      <div key={`deleted-${media.id}`} className="relative bg-red-50 border border-red-200 rounded-lg p-2 opacity-60">
                        <div className="w-full h-16 bg-gray-100 rounded mb-1 flex items-center justify-center overflow-hidden">
                          {media.type === 'image' ? (
                            <img
                              src={media.preview}
                              alt={media.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <div className="text-xs">{media.type.toUpperCase()}</div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{media.title}</div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TrashIcon className="w-6 h-6 text-red-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 正常编辑视图
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={mediaItems.map(item => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mediaItems.map((media) => (
                    <SortableMediaItem
                      key={media.id}
                      media={media}
                      onDelete={handleDelete}
                      onPreview={handlePreview}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleApply} disabled={mediaItems.length === 0}>
              应用排序
            </Button>
          </div>
        </div>
      </div>

      {/* 预览模态框 */}
      {previewMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{previewMedia.title}</h3>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-w-full max-h-96 flex items-center justify-center">
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.preview}
                  alt={previewMedia.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-500 p-8">
                  <div className="text-lg">{previewMedia.type.toUpperCase()}</div>
                  <div className="text-sm mt-2">{previewMedia.preview}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaSortDialog
