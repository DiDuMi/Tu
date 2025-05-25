import React from 'react'
import Link from 'next/link'
import { MediaItem } from '@/stores/mediaStore'
import { formatFileSize } from '@/lib/upload'

interface MediaListViewProps {
  mediaItems: MediaItem[]
  selectedItems: string[]
  onSelectItem: (uuid: string, isSelected: boolean) => void
  onSelectAll: () => void
  className?: string
}

const MediaListView: React.FC<MediaListViewProps> = ({
  mediaItems,
  selectedItems,
  onSelectItem,
  onSelectAll,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={selectedItems.length === mediaItems.length && mediaItems.length > 0}
                onChange={onSelectAll}
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              预览
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              名称
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              类型
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              大小
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              尺寸
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              上传时间
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mediaItems.map((item) => (
            <MediaListItem 
              key={item.uuid} 
              item={item} 
              isSelected={selectedItems.includes(item.uuid)}
              onSelect={onSelectItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 媒体列表项组件
interface MediaListItemProps {
  item: MediaItem
  isSelected: boolean
  onSelect: (uuid: string, isSelected: boolean) => void
}

export const MediaListItem: React.FC<MediaListItemProps> = ({ item, isSelected, onSelect }) => {
  const isImage = item.type === 'IMAGE'
  const formattedDate = new Date(item.createdAt).toLocaleString()
  
  return (
    <tr className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          checked={isSelected}
          onChange={() => onSelect(item.uuid, isSelected)}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
          {isImage ? (
            <img
              src={item.url}
              alt={item.title || '图片'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{item.title}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.type === 'IMAGE' ? 'bg-green-100 text-green-800' : 
          item.type === 'VIDEO' ? 'bg-blue-100 text-blue-800' : 
          'bg-purple-100 text-purple-800'
        }`}>
          {item.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(item.fileSize || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formattedDate}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link href={`/admin/media/${item.uuid}`} className="text-blue-600 hover:text-blue-900 mr-3">
          详情
        </Link>
      </td>
    </tr>
  )
}

export default MediaListView
