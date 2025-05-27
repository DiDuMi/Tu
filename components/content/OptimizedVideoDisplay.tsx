import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedVideoDisplayProps {
  content: string
  hasVideoPermission: boolean
  className?: string
}

/**
 * 优化的视频显示组件
 * 专门用于内容详情页面，提供更好的视频观看体验
 */
export default function OptimizedVideoDisplay({
  content,
  hasVideoPermission,
  className = ''
}: OptimizedVideoDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [processedContent, setProcessedContent] = useState('')

  useEffect(() => {
    // 处理内容，添加视频优化样式
    let processed = content

    if (!hasVideoPermission) {
      // 如果没有权限，替换所有视频为权限提示
      processed = processed.replace(
        /<video[^>]*>[\s\S]*?<\/video>/gi,
        `<div class="relative w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center my-6 shadow-lg">
          <div class="absolute inset-0 bg-blue-100 opacity-20 rounded-xl"></div>
          <div class="relative z-10">
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">视频内容需要会员权限</h3>
            <p class="text-gray-600 mb-4">升级会员以观看高清视频内容</p>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              立即升级
            </button>
          </div>
        </div>`
      )

      // 替换iframe视频
      processed = processed.replace(
        /<iframe[^>]*(?:youtube|youku|bilibili|vimeo)[^>]*>[\s\S]*?<\/iframe>/gi,
        `<div class="relative w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8 text-center my-6 shadow-lg">
          <div class="absolute inset-0 bg-blue-100 opacity-20 rounded-xl"></div>
          <div class="relative z-10">
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">视频内容需要会员权限</h3>
            <p class="text-gray-600 mb-4">升级会员以观看完整视频内容</p>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
              立即升级
            </button>
          </div>
        </div>`
      )
    } else {
      // 如果有权限，优化视频显示
      processed = processed.replace(
        /<video([^>]*)>/gi,
        `<div class="video-optimized-container w-full my-8 flex justify-center">
          <div class="relative w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl">
            <video$1 class="w-full h-auto max-h-[75vh] min-h-[400px] object-contain" style="display: block; background-color: #000;" controls preload="metadata">`
      )

      processed = processed.replace(
        /<\/video>/gi,
        `</video>
            <div class="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm z-10">HD</div>
          </div>
        </div>`
      )

      // 优化iframe显示
      processed = processed.replace(
        /<iframe([^>]*(?:youtube|youku|bilibili|vimeo)[^>]*)>/gi,
        `<div class="iframe-optimized-container w-full my-8 flex justify-center">
          <div class="relative w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl" style="aspect-ratio: 16/9; min-height: 400px;">
            <iframe$1 class="absolute inset-0 w-full h-full rounded-xl" style="border: none; background-color: #000;">`
      )

      processed = processed.replace(
        /<\/iframe>/gi,
        `</iframe>
            <div class="absolute top-4 right-4 bg-red-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm z-10">Video</div>
          </div>
        </div>`
      )
    }

    setProcessedContent(processed)
  }, [content, hasVideoPermission])



  return (
    <div
      ref={contentRef}
      className={cn('optimized-video-content', className)}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}
