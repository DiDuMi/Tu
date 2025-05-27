import { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { videoPerformanceMonitor } from '@/lib/video-performance-monitor'

/**
 * 获取视频压缩性能统计和优化建议
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  try {
    const user = (req as any).user
    const { type = 'user' } = req.query

    let stats
    let suggestions
    let history

    if (type === 'admin' && user.role === 'ADMIN') {
      // 管理员查看全局统计
      stats = videoPerformanceMonitor.getPerformanceStats()
      suggestions = videoPerformanceMonitor.generateOptimizationSuggestions()
      history = videoPerformanceMonitor.exportMetrics().slice(-100) // 最近100条记录
    } else {
      // 普通用户查看个人统计
      stats = videoPerformanceMonitor.getPerformanceStats(user.id)
      suggestions = [] // 个人用户暂不提供优化建议
      history = videoPerformanceMonitor.getUserHistory(user.id, 20)
    }

    // 格式化统计数据
    const formattedStats = {
      totalProcessed: stats.totalProcessed,
      successRate: Math.round(stats.successRate * 100) / 100,
      averageProcessingTime: Math.round(stats.averageProcessingTime / 1000 * 100) / 100, // 转换为秒
      averageCompressionRatio: Math.round(stats.averageCompressionRatio * 100 * 100) / 100, // 转换为百分比
      averageFileSizeReduction: Math.round(stats.averageFileSizeReduction * 100 * 100) / 100, // 转换为百分比
      extremes: {
        slowest: stats.slowestProcessing ? {
          filename: stats.slowestProcessing.filename,
          processingTime: Math.round(stats.slowestProcessing.processingTime / 1000 * 100) / 100,
          originalSize: Math.round(stats.slowestProcessing.originalSize / 1024 / 1024 * 100) / 100,
          preset: stats.slowestProcessing.preset,
          resolution: stats.slowestProcessing.resolution
        } : null,
        fastest: stats.fastestProcessing ? {
          filename: stats.fastestProcessing.filename,
          processingTime: Math.round(stats.fastestProcessing.processingTime / 1000 * 100) / 100,
          originalSize: Math.round(stats.fastestProcessing.originalSize / 1024 / 1024 * 100) / 100,
          preset: stats.fastestProcessing.preset,
          resolution: stats.fastestProcessing.resolution
        } : null,
        bestCompression: stats.bestCompression ? {
          filename: stats.bestCompression.filename,
          compressionRatio: Math.round(stats.bestCompression.compressionRatio * 100 * 100) / 100,
          originalSize: Math.round(stats.bestCompression.originalSize / 1024 / 1024 * 100) / 100,
          compressedSize: Math.round(stats.bestCompression.compressedSize / 1024 / 1024 * 100) / 100,
          crf: stats.bestCompression.crf,
          preset: stats.bestCompression.preset
        } : null,
        worstCompression: stats.worstCompression ? {
          filename: stats.worstCompression.filename,
          compressionRatio: Math.round(stats.worstCompression.compressionRatio * 100 * 100) / 100,
          originalSize: Math.round(stats.worstCompression.originalSize / 1024 / 1024 * 100) / 100,
          compressedSize: Math.round(stats.worstCompression.compressedSize / 1024 / 1024 * 100) / 100,
          crf: stats.worstCompression.crf,
          preset: stats.worstCompression.preset
        } : null
      }
    }

    // 格式化历史记录
    const formattedHistory = history.map(record => ({
      taskId: record.taskId,
      filename: record.filename,
      originalSize: Math.round(record.originalSize / 1024 / 1024 * 100) / 100, // MB
      compressedSize: record.compressedSize ? Math.round(record.compressedSize / 1024 / 1024 * 100) / 100 : null,
      processingTime: Math.round(record.processingTime / 1000 * 100) / 100, // 秒
      compressionRatio: record.compressionRatio ? Math.round(record.compressionRatio * 100 * 100) / 100 : null,
      crf: record.crf,
      preset: record.preset,
      resolution: record.resolution,
      codec: record.codec,
      success: record.success,
      error: record.error,
      timestamp: new Date(record.timestamp).toISOString()
    }))

    const response = {
      stats: formattedStats,
      suggestions,
      history: formattedHistory,
      recommendations: generateRecommendations(formattedStats)
    }

    return successResponse(res, response, '获取压缩统计成功')
  } catch (error) {
    console.error('获取压缩统计失败:', error)
    return errorResponse(
      res,
      'STATS_FETCH_FAILED',
      '获取压缩统计失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

/**
 * 生成用户友好的建议
 */
function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = []

  if (stats.totalProcessed === 0) {
    recommendations.push('还没有处理过视频，上传一些视频来查看统计信息吧！')
    return recommendations
  }

  if (stats.successRate < 90) {
    recommendations.push('视频处理成功率较低，建议检查视频格式或联系管理员')
  }

  if (stats.averageProcessingTime > 120) {
    recommendations.push('视频处理时间较长，建议上传前先压缩视频或选择较小的文件')
  }

  if (stats.averageCompressionRatio < 30) {
    recommendations.push('压缩效果一般，建议上传高质量原始视频以获得更好的压缩效果')
  }

  if (stats.averageCompressionRatio > 70) {
    recommendations.push('压缩效果很好！继续保持当前的上传习惯')
  }

  if (stats.averageProcessingTime < 30) {
    recommendations.push('处理速度很快！您的视频很适合我们的压缩系统')
  }

  if (recommendations.length === 0) {
    recommendations.push('您的视频处理表现良好，继续保持！')
  }

  return recommendations
}

export default withErrorHandler(withAuth(handler))
