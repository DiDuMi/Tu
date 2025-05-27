import { PerformanceMetrics } from './PerformanceMetrics'

interface PerformanceReportProps {
  metrics: PerformanceMetrics
}

// 获取性能评分
const getPerformanceScore = (metrics: PerformanceMetrics) => {
  let score = 100
  
  // LCP评分 (理想 < 2.5s)
  if (metrics.lcp) {
    if (metrics.lcp > 4000) score -= 30
    else if (metrics.lcp > 2500) score -= 15
  }
  
  // FCP评分 (理想 < 1.8s)
  if (metrics.fcp) {
    if (metrics.fcp > 3000) score -= 20
    else if (metrics.fcp > 1800) score -= 10
  }
  
  // CLS评分 (理想 < 0.1)
  if (metrics.cls) {
    if (metrics.cls > 0.25) score -= 25
    else if (metrics.cls > 0.1) score -= 10
  }
  
  // 图片加载失败率
  if (metrics.totalImages > 0) {
    const failureRate = metrics.failedImages / metrics.totalImages
    if (failureRate > 0.1) score -= 15
    else if (failureRate > 0.05) score -= 5
  }
  
  return Math.max(0, score)
}

// 格式化时间
const formatTime = (time?: number) => {
  if (!time) return 'N/A'
  return `${time.toFixed(0)}ms`
}

export default function PerformanceReport({ metrics }: PerformanceReportProps) {
  const score = getPerformanceScore(metrics)

  return (
    <>
      {/* 性能评分标题 */}
      <div className="flex items-center justify-between">
        <span>性能监控</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            评分: {score}/100
          </span>
          <div 
            className={`w-3 h-3 rounded-full ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* 图片加载详情 */}
      {Object.keys(metrics.imageLoadTimes).length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">图片加载详情</h4>
          <div className="max-h-32 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(metrics.imageLoadTimes).map(([imageId, time]) => (
                <div key={imageId} className="flex justify-between">
                  <span className="truncate">{imageId}</span>
                  <span className={time > 1000 ? 'text-red-600' : 'text-green-600'}>
                    {formatTime(time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
