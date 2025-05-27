import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'

const metricsSchema = z.object({
  src: z.string().url('无效的视频URL'),
  loadTime: z.number().positive('加载时间必须为正数'),
  success: z.boolean(),
  error: z.string().optional(),
  userAgent: z.string().optional(),
  connectionType: z.string().optional(),
  videoWidth: z.number().positive().optional(),
  videoHeight: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  bufferedPercentage: z.number().min(0).max(100).optional(),
  playbackQuality: z.enum(['low', 'medium', 'high', 'auto']).optional(),
  format: z.string().optional(),
  timestamp: z.number().optional()
})

const queryMetricsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  src: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0)
})

// 内存中的指标存储（生产环境应使用数据库）
const videoMetrics: Array<{
  id: string
  src: string
  loadTime: number
  success: boolean
  error?: string
  userAgent?: string
  connectionType?: string
  videoWidth?: number
  videoHeight?: number
  duration?: number
  bufferedPercentage?: number
  playbackQuality?: string
  format?: string
  timestamp: number
  createdAt: Date
}> = []

/**
 * 视频性能监控API
 * 收集和查询视频播放性能指标
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // 记录性能指标
      const validation = metricsSchema.safeParse(req.body)
      if (!validation.success) {
        return errorResponse(
          res,
          'INVALID_REQUEST',
          '无效的请求参数',
          validation.error.errors,
          400
        )
      }

      const data = validation.data
      const metric = {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        timestamp: data.timestamp || Date.now(),
        createdAt: new Date()
      }

      // 存储指标（限制内存使用，只保留最近1000条记录）
      videoMetrics.push(metric)
      if (videoMetrics.length > 1000) {
        videoMetrics.shift()
      }

      return successResponse(res, {
        id: metric.id,
        recorded: true,
        timestamp: metric.timestamp
      })

    } else if (req.method === 'GET') {
      // 查询性能指标
      const validation = queryMetricsSchema.safeParse(req.query)
      if (!validation.success) {
        return errorResponse(
          res,
          'INVALID_REQUEST',
          '无效的查询参数',
          validation.error.errors,
          400
        )
      }

      const { startDate, endDate, src, limit, offset } = validation.data

      // 过滤数据
      let filteredMetrics = [...videoMetrics]

      if (src) {
        filteredMetrics = filteredMetrics.filter(m => m.src === src)
      }

      if (startDate) {
        const start = new Date(startDate)
        filteredMetrics = filteredMetrics.filter(m => m.createdAt >= start)
      }

      if (endDate) {
        const end = new Date(endDate)
        filteredMetrics = filteredMetrics.filter(m => m.createdAt <= end)
      }

      // 排序（最新的在前）
      filteredMetrics.sort((a, b) => b.timestamp - a.timestamp)

      // 分页
      const total = filteredMetrics.length
      const paginatedMetrics = filteredMetrics.slice(offset, offset + limit)

      // 计算统计信息
      const successfulMetrics = filteredMetrics.filter(m => m.success)
      const failedMetrics = filteredMetrics.filter(m => !m.success)

      const stats = {
        total,
        successful: successfulMetrics.length,
        failed: failedMetrics.length,
        successRate: total > 0 ? (successfulMetrics.length / total) * 100 : 0,
        averageLoadTime: successfulMetrics.length > 0 
          ? successfulMetrics.reduce((sum, m) => sum + m.loadTime, 0) / successfulMetrics.length 
          : 0,
        medianLoadTime: 0, // 计算中位数
        p95LoadTime: 0,    // 计算95百分位
        p99LoadTime: 0     // 计算99百分位
      }

      // 计算百分位数
      if (successfulMetrics.length > 0) {
        const sortedLoadTimes = successfulMetrics
          .map(m => m.loadTime)
          .sort((a, b) => a - b)
        
        const medianIndex = Math.floor(sortedLoadTimes.length / 2)
        stats.medianLoadTime = sortedLoadTimes[medianIndex]
        
        const p95Index = Math.floor(sortedLoadTimes.length * 0.95)
        stats.p95LoadTime = sortedLoadTimes[p95Index]
        
        const p99Index = Math.floor(sortedLoadTimes.length * 0.99)
        stats.p99LoadTime = sortedLoadTimes[p99Index]
      }

      // 错误分析
      const errorAnalysis = failedMetrics.reduce((acc, metric) => {
        const error = metric.error || 'Unknown Error'
        acc[error] = (acc[error] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // 用户代理分析
      const userAgentAnalysis = filteredMetrics.reduce((acc, metric) => {
        if (metric.userAgent) {
          const browser = extractBrowserFromUserAgent(metric.userAgent)
          acc[browser] = (acc[browser] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      // 质量分析
      const qualityAnalysis = filteredMetrics.reduce((acc, metric) => {
        const quality = metric.playbackQuality || 'unknown'
        acc[quality] = (acc[quality] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return successResponse(res, {
        metrics: paginatedMetrics,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        statistics: stats,
        analysis: {
          errors: errorAnalysis,
          userAgents: userAgentAnalysis,
          qualities: qualityAnalysis
        }
      })

    } else {
      return errorResponse(
        res,
        'METHOD_NOT_ALLOWED',
        '不支持的请求方法',
        `此端点支持GET和POST请求，收到${req.method}`,
        405
      )
    }

  } catch (error) {
    console.error('性能监控API错误:', error)
    return errorResponse(
      res,
      'METRICS_API_ERROR',
      '性能监控API错误',
      error instanceof Error ? error.message : '未知错误',
      500
    )
  }
}

/**
 * 从User-Agent中提取浏览器信息
 */
function extractBrowserFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome'
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari'
  } else if (userAgent.includes('Edg')) {
    return 'Edge'
  } else if (userAgent.includes('Opera')) {
    return 'Opera'
  } else {
    return 'Other'
  }
}

export default withErrorHandler(handler)
