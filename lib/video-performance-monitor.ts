/**
 * 视频处理性能监控器
 * 监控视频压缩性能，提供优化建议
 */

export interface ProcessingMetrics {
  taskId: string
  userId: number
  filename: string
  originalSize: number
  compressedSize: number
  originalDuration: number
  processingTime: number
  compressionRatio: number
  crf: number
  preset: string
  resolution: string
  codec: string
  success: boolean
  error?: string
  timestamp: number
}

export interface PerformanceStats {
  totalProcessed: number
  successRate: number
  averageProcessingTime: number
  averageCompressionRatio: number
  averageFileSizeReduction: number
  slowestProcessing: ProcessingMetrics | null
  fastestProcessing: ProcessingMetrics | null
  bestCompression: ProcessingMetrics | null
  worstCompression: ProcessingMetrics | null
}

export interface OptimizationSuggestion {
  type: 'preset' | 'crf' | 'resolution' | 'codec' | 'timeout'
  current: string
  suggested: string
  reason: string
  expectedImprovement: string
}

class VideoPerformanceMonitor {
  private static instance: VideoPerformanceMonitor
  private metrics: Map<string, ProcessingMetrics> = new Map()
  private readonly maxMetrics = 1000 // 最多保存1000条记录

  static getInstance(): VideoPerformanceMonitor {
    if (!VideoPerformanceMonitor.instance) {
      VideoPerformanceMonitor.instance = new VideoPerformanceMonitor()
    }
    return VideoPerformanceMonitor.instance
  }

  /**
   * 记录处理开始
   */
  startProcessing(taskId: string, userId: number, filename: string, originalSize: number): void {
    const metric: Partial<ProcessingMetrics> = {
      taskId,
      userId,
      filename,
      originalSize,
      timestamp: Date.now()
    }
    
    this.metrics.set(taskId, metric as ProcessingMetrics)
  }

  /**
   * 记录处理完成
   */
  recordSuccess(
    taskId: string,
    compressedSize: number,
    originalDuration: number,
    crf: number,
    preset: string,
    resolution: string,
    codec: string
  ): void {
    const metric = this.metrics.get(taskId)
    if (!metric) return

    const processingTime = Date.now() - metric.timestamp
    const compressionRatio = 1 - (compressedSize / metric.originalSize)

    Object.assign(metric, {
      compressedSize,
      originalDuration,
      processingTime,
      compressionRatio,
      crf,
      preset,
      resolution,
      codec,
      success: true
    })

    console.log(`📊 视频处理完成: ${taskId}`, {
      processingTime: `${(processingTime / 1000).toFixed(1)}s`,
      compressionRatio: `${(compressionRatio * 100).toFixed(1)}%`,
      sizeBefore: `${(metric.originalSize / 1024 / 1024).toFixed(1)}MB`,
      sizeAfter: `${(compressedSize / 1024 / 1024).toFixed(1)}MB`
    })

    this.cleanupOldMetrics()
  }

  /**
   * 记录处理失败
   */
  recordFailure(taskId: string, error: string): void {
    const metric = this.metrics.get(taskId)
    if (!metric) return

    const processingTime = Date.now() - metric.timestamp

    Object.assign(metric, {
      processingTime,
      success: false,
      error
    })

    console.log(`❌ 视频处理失败: ${taskId}`, {
      processingTime: `${(processingTime / 1000).toFixed(1)}s`,
      error
    })

    this.cleanupOldMetrics()
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(userId?: number): PerformanceStats {
    const allMetrics = Array.from(this.metrics.values())
    const filteredMetrics = userId 
      ? allMetrics.filter(m => m.userId === userId && m.success)
      : allMetrics.filter(m => m.success)

    if (filteredMetrics.length === 0) {
      return {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        averageCompressionRatio: 0,
        averageFileSizeReduction: 0,
        slowestProcessing: null,
        fastestProcessing: null,
        bestCompression: null,
        worstCompression: null
      }
    }

    const totalProcessed = allMetrics.length
    const successCount = filteredMetrics.length
    const successRate = (successCount / totalProcessed) * 100

    const averageProcessingTime = filteredMetrics.reduce((sum, m) => sum + m.processingTime, 0) / successCount
    const averageCompressionRatio = filteredMetrics.reduce((sum, m) => sum + m.compressionRatio, 0) / successCount
    const averageFileSizeReduction = filteredMetrics.reduce((sum, m) => 
      sum + (1 - m.compressedSize / m.originalSize), 0) / successCount

    // 找出极值
    const slowestProcessing = filteredMetrics.reduce((slowest, current) => 
      !slowest || current.processingTime > slowest.processingTime ? current : slowest, null as ProcessingMetrics | null)

    const fastestProcessing = filteredMetrics.reduce((fastest, current) => 
      !fastest || current.processingTime < fastest.processingTime ? current : fastest, null as ProcessingMetrics | null)

    const bestCompression = filteredMetrics.reduce((best, current) => 
      !best || current.compressionRatio > best.compressionRatio ? current : best, null as ProcessingMetrics | null)

    const worstCompression = filteredMetrics.reduce((worst, current) => 
      !worst || current.compressionRatio < worst.compressionRatio ? current : worst, null as ProcessingMetrics | null)

    return {
      totalProcessed,
      successRate,
      averageProcessingTime,
      averageCompressionRatio,
      averageFileSizeReduction,
      slowestProcessing,
      fastestProcessing,
      bestCompression,
      worstCompression
    }
  }

  /**
   * 生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const stats = this.getPerformanceStats()
    const suggestions: OptimizationSuggestion[] = []

    if (stats.totalProcessed < 10) {
      return suggestions // 数据不足，无法提供建议
    }

    // 分析处理时间
    if (stats.averageProcessingTime > 120000) { // 超过2分钟
      suggestions.push({
        type: 'preset',
        current: 'medium/slow',
        suggested: 'fast/veryfast',
        reason: '平均处理时间过长，建议使用更快的预设',
        expectedImprovement: '处理时间减少30-50%'
      })
    }

    // 分析压缩效果
    if (stats.averageCompressionRatio < 0.3) { // 压缩率低于30%
      suggestions.push({
        type: 'crf',
        current: 'CRF 25+',
        suggested: 'CRF 20-23',
        reason: '压缩效果不佳，建议降低CRF值提高压缩率',
        expectedImprovement: '文件大小减少20-40%'
      })
    }

    // 分析失败率
    if (stats.successRate < 90) {
      suggestions.push({
        type: 'timeout',
        current: '3分钟',
        suggested: '5分钟',
        reason: '成功率较低，可能是超时导致，建议增加处理时间限制',
        expectedImprovement: '成功率提升至95%以上'
      })
    }

    // 分析编码器使用
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => m.success && Date.now() - m.timestamp < 7 * 24 * 60 * 60 * 1000) // 最近7天
      .slice(-50) // 最近50个

    const h264Count = recentMetrics.filter(m => m.codec === 'h264').length
    const h265Count = recentMetrics.filter(m => m.codec === 'h265').length

    if (h264Count > 0 && h265Count === 0) {
      suggestions.push({
        type: 'codec',
        current: 'H.264',
        suggested: 'H.265',
        reason: '建议尝试H.265编码器，可获得更好的压缩效果',
        expectedImprovement: '文件大小减少20-30%，但处理时间可能增加'
      })
    }

    return suggestions
  }

  /**
   * 获取用户处理历史
   */
  getUserHistory(userId: number, limit: number = 20): ProcessingMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * 清理旧的指标数据
   */
  private cleanupOldMetrics(): void {
    if (this.metrics.size <= this.maxMetrics) return

    // 按时间戳排序，删除最旧的记录
    const sortedEntries = Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    const toDelete = sortedEntries.slice(0, this.metrics.size - this.maxMetrics)
    toDelete.forEach(([taskId]) => this.metrics.delete(taskId))

    console.log(`🧹 清理了 ${toDelete.length} 条旧的性能指标`)
  }

  /**
   * 导出性能数据
   */
  exportMetrics(): ProcessingMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.metrics.clear()
  }
}

export const videoPerformanceMonitor = VideoPerformanceMonitor.getInstance()
export default VideoPerformanceMonitor
