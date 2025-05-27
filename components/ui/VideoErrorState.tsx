import { cn } from '@/lib/utils'

interface VideoErrorStateProps {
  isVisible: boolean
  className?: string
}

export default function VideoErrorState({
  isVisible,
  className = ''
}: VideoErrorStateProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400',
      className
    )}>
      <svg className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span className="text-sm">视频加载失败</span>
    </div>
  )
}
