interface VideoControlsProps {
  attempts: number
  retryCount: number
  enablePerformanceMonitoring: boolean
  videoReady: boolean
  loadProgress: number
}

export default function VideoControls({
  attempts,
  retryCount,
  enablePerformanceMonitoring,
  videoReady,
  loadProgress
}: VideoControlsProps) {
  return (
    <>
      {/* 重试指示器 */}
      {attempts > 0 && attempts < retryCount && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          重试 {attempts}/{retryCount}
        </div>
      )}

      {/* 性能指示器 */}
      {enablePerformanceMonitoring && videoReady && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {loadProgress.toFixed(0)}% 已缓冲
        </div>
      )}
    </>
  )
}
