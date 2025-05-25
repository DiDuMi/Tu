import { useEffect, useRef } from 'react'
import VideoPermissionNotice from '@/components/ui/VideoPermissionNotice'

interface VideoContentProcessorProps {
  content: string
  hasVideoPermission: boolean
  className?: string
}

export default function VideoContentProcessor({ 
  content, 
  hasVideoPermission, 
  className = '' 
}: VideoContentProcessorProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current || hasVideoPermission) {
      return
    }

    const container = contentRef.current

    // 查找所有视频元素
    const videos = container.querySelectorAll('video')
    const videoIframes = container.querySelectorAll('iframe[src*="youtube"], iframe[src*="youku"], iframe[src*="bilibili"], iframe[src*="vimeo"]')

    // 替换视频元素
    videos.forEach(video => {
      const notice = document.createElement('div')
      notice.innerHTML = `
        <div class="video-permission-notice bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center my-4">
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <div class="relative">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <svg class="w-4 h-4 text-gray-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">🎬 视频内容</h3>
              <p class="text-gray-600 mb-4">此处包含视频内容，您当前的用户组暂无播放权限</p>
              <div class="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors cursor-pointer">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                升级会员以观看视频内容
              </div>
            </div>
          </div>
        </div>
      `
      video.parentNode?.replaceChild(notice, video)
    })

    // 替换视频iframe
    videoIframes.forEach(iframe => {
      const notice = document.createElement('div')
      notice.innerHTML = `
        <div class="video-permission-notice bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center my-4">
          <div class="flex flex-col items-center space-y-4">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <div class="relative">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <svg class="w-4 h-4 text-gray-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">🎬 视频内容</h3>
              <p class="text-gray-600 mb-4">此处包含视频内容，您当前的用户组暂无播放权限</p>
              <div class="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors cursor-pointer">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                升级会员以观看视频内容
              </div>
            </div>
          </div>
        </div>
      `
      iframe.parentNode?.replaceChild(notice, iframe)
    })
  }, [content, hasVideoPermission])

  return (
    <div 
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
