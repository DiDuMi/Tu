import React from 'react'
import Link from 'next/link'
import { MediaItem } from '@/stores/mediaStore'
import { formatFileSize } from '@/lib/upload'

interface MediaGridViewProps {
  mediaItems: MediaItem[]
  selectedItems: string[]
  onSelectItem: (uuid: string, isSelected: boolean) => void
  className?: string
}

const MediaGridView: React.FC<MediaGridViewProps> = ({
  mediaItems,
  selectedItems,
  onSelectItem,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {mediaItems.map((item) => (
        <MediaGridItem 
          key={item.uuid} 
          item={item} 
          isSelected={selectedItems.includes(item.uuid)}
          onSelect={onSelectItem}
        />
      ))}
    </div>
  )
}

// 媒体网格项组件
interface MediaGridItemProps {
  item: MediaItem
  isSelected: boolean
  onSelect: (uuid: string, isSelected: boolean) => void
}

export const MediaGridItem: React.FC<MediaGridItemProps> = ({ item, isSelected, onSelect }) => {
  const isImage = item.type === 'IMAGE'
  
  return (
    <div className={`relative rounded-lg overflow-hidden border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} group`}>
      {/* 选择复选框 */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          checked={isSelected}
          onChange={() => onSelect(item.uuid, isSelected)}
        />
      </div>
      
      {/* 媒体预览 */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
        {isImage ? (
          <img
            src={item.url}
            alt={item.title || '图片'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* 媒体信息 */}
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
        <p className="text-xs text-gray-500">{formatFileSize(item.fileSize || 0)}</p>
      </div>
      
      {/* 悬停时显示的操作按钮 */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/admin/media/${item.uuid}`} className="bg-white text-gray-800 p-2 rounded-full mx-1 hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

export default MediaGridView
