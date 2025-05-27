import { cn } from '@/lib/utils'

interface VideoLoadingStateProps {
  isVisible: boolean
  progress: number
  className?: string
}

export default function VideoLoadingState({
  isVisible,
  progress,
  className = ''
}: VideoLoadingStateProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'absolute inset-0 bg-gray-100 flex flex-col items-center justify-center z-10',
      className
    )}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
      <div className="text-sm text-gray-600">加载视频中...</div>
      {progress > 0 && (
        <div className="w-32 bg-gray-200 rounded-full h-1 mt-2">
          <div
            className="bg-primary-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
