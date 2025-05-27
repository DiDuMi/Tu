import { PerformanceMetrics } from './PerformanceMetrics'

interface MonitoringChartProps {
  metrics: PerformanceMetrics
}

// 格式化时间
const formatTime = (time?: number) => {
  if (!time) return 'N/A'
  return `${time.toFixed(0)}ms`
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function MonitoringChart({ metrics }: MonitoringChartProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Core Web Vitals */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Core Web Vitals</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>LCP:</span>
            <span className={metrics.lcp && metrics.lcp > 2500 ? 'text-red-600' : 'text-green-600'}>
              {formatTime(metrics.lcp)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>FCP:</span>
            <span className={metrics.fcp && metrics.fcp > 1800 ? 'text-red-600' : 'text-green-600'}>
              {formatTime(metrics.fcp)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>CLS:</span>
            <span className={metrics.cls && metrics.cls > 0.1 ? 'text-red-600' : 'text-green-600'}>
              {metrics.cls?.toFixed(3) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>TTFB:</span>
            <span>{formatTime(metrics.ttfb)}</span>
          </div>
        </div>
      </div>

      {/* 图片指标 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">图片加载</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>总数:</span>
            <span>{metrics.totalImages}</span>
          </div>
          <div className="flex justify-between">
            <span>已加载:</span>
            <span className="text-green-600">{metrics.loadedImages}</span>
          </div>
          <div className="flex justify-between">
            <span>失败:</span>
            <span className="text-red-600">{metrics.failedImages}</span>
          </div>
          <div className="flex justify-between">
            <span>成功率:</span>
            <span>
              {metrics.totalImages > 0 
                ? `${((metrics.loadedImages / metrics.totalImages) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 网络指标 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">网络资源</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>资源数:</span>
            <span>{metrics.totalResourceCount}</span>
          </div>
          <div className="flex justify-between">
            <span>传输大小:</span>
            <span>{formatSize(metrics.totalTransferSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>平均大小:</span>
            <span>
              {metrics.totalResourceCount > 0 
                ? formatSize(metrics.totalTransferSize / metrics.totalResourceCount)
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 时间信息 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-2">时间信息</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>运行时间:</span>
            <span>{formatTime(metrics.lastUpdate - metrics.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>最后更新:</span>
            <span>{new Date(metrics.lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
