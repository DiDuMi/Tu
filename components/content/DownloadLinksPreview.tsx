import { useState, useEffect } from 'react'
import { getPlatformById } from '@/lib/download-platforms'

interface DownloadLink {
  id: number
  uuid: string
  platform: string
  pointCost: number
  title: string
  description?: string
  isActive: boolean
  sortOrder: number
}

interface DownloadLinksPreviewProps {
  pageId: string | number
  className?: string
}

export default function DownloadLinksPreview({ pageId, className = '' }: DownloadLinksPreviewProps) {
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDownloadLinks()
  }, [pageId])

  const fetchDownloadLinks = async () => {
    try {
      const response = await fetch(`/api/v1/pages/${pageId}/download-links`)
      const data = await response.json()

      if (data.success) {
        const activeLinks = data.data ? data.data.filter((link: DownloadLink) => link.isActive) : []
        setDownloadLinks(activeLinks)
      } else {
        setDownloadLinks([])
      }
    } catch (error) {
      console.error('获取下载链接失败:', error)
      setDownloadLinks([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    )
  }

  if (downloadLinks.length === 0) {
    return (
      <div className={`bg-white/95 backdrop-blur-md rounded-lg p-4 border border-white/20 ${className}`}>
        <div className="flex items-center mb-3">
          <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-800">资源下载</span>
        </div>
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">暂无下载链接</div>
          <div className="text-gray-400 text-xs mt-1">作者还未添加下载资源</div>
        </div>
      </div>
    )
  }

  // 只显示前3个下载链接
  const previewLinks = downloadLinks.slice(0, 3)
  const hasMore = downloadLinks.length > 3

  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-lg p-4 border border-white/20 ${className}`}>
      <div className="flex items-center mb-3">
        <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium text-gray-800">资源下载</span>
      </div>

      <div className="space-y-2">
        {previewLinks.map((link) => {
          const platform = getPlatformById(link.platform)

          return (
            <div key={link.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-medium`}>
                  <span className="text-xs">{platform?.icon || '📦'}</span>
                </div>
                <span className="text-gray-700 truncate max-w-[120px]" title={link.title}>{link.title}</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-600 font-medium">{link.pointCost}</span>
              </div>
            </div>
          )
        })}

        {hasMore && (
          <div className="text-xs text-gray-500 text-center pt-1">
            +{downloadLinks.length - 3} 个下载选项
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          向下滚动查看完整下载选项
        </div>
      </div>
    </div>
  )
}
