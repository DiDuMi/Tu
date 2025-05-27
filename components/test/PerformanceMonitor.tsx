import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import MonitoringChart from './MonitoringChart'
import PerformanceMetricsComponent, { PerformanceMetrics as PerformanceMetricsType } from './PerformanceMetrics'
import PerformanceReport from './PerformanceReport'

// PerformanceMetrics 接口已移至 PerformanceMetrics.tsx

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetricsType) => void
  trackImages?: boolean
  autoReset?: boolean
}

export function PerformanceMonitor({
  onMetricsUpdate,
  trackImages = true,
  autoReset = false
}: PerformanceMonitorProps) {
  // 使用性能指标收集组件
  const { metrics } = PerformanceMetricsComponent({
    onMetricsUpdate,
    trackImages,
    autoReset
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <PerformanceReport metrics={metrics} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MonitoringChart metrics={metrics} />
      </CardContent>
    </Card>
  )
}

export default PerformanceMonitor
