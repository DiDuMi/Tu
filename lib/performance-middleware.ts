/**
 * 性能监控中间件
 * 用于监控API请求性能和数据库查询性能
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface PerformanceMetrics {
  requestId: string
  method: string
  url: string
  startTime: number
  endTime?: number
  duration?: number
  dbQueries: Array<{
    operation: string
    duration: number
    model: string
    args?: any
  }>
  memoryUsage?: NodeJS.MemoryUsage
  statusCode?: number
  error?: string
}

// 存储性能指标
const performanceMetrics = new Map<string, PerformanceMetrics>()

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 性能监控中间件
 */
export function withPerformanceMonitoring(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    // 初始化性能指标
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method || 'UNKNOWN',
      url: req.url || '',
      startTime,
      dbQueries: [],
    }

    // 添加到性能指标存储
    performanceMetrics.set(requestId, metrics)

    // 监控内存使用
    const initialMemory = process.memoryUsage()

    // 重写res.end方法来捕获响应时间
    const originalEnd = res.end
    res.end = function(chunk?: any, encoding?: any): NextApiResponse {
      const endTime = Date.now()
      const duration = endTime - startTime

      // 更新性能指标
      metrics.endTime = endTime
      metrics.duration = duration
      metrics.memoryUsage = process.memoryUsage()
      metrics.statusCode = res.statusCode

      // 记录慢请求
      if (duration > 1000) { // 超过1秒的请求
        console.warn(`[性能警告] 慢请求: ${req.method} ${req.url} - ${duration}ms`)
        console.warn(`[性能详情]`, {
          requestId,
          duration,
          statusCode: res.statusCode,
          dbQueries: metrics.dbQueries.length,
          memoryDelta: {
            heapUsed: metrics.memoryUsage.heapUsed - initialMemory.heapUsed,
            external: metrics.memoryUsage.external - initialMemory.external,
          }
        })
      }

      // 清理旧的性能指标（保留最近100个）
      if (performanceMetrics.size > 100) {
        const oldestKey = performanceMetrics.keys().next().value
        if (oldestKey) {
          performanceMetrics.delete(oldestKey)
        }
      }

      // 调用原始的end方法
      return originalEnd.call(this, chunk, encoding) as NextApiResponse
    }

    try {
      // 执行原始处理器
      await handler(req, res)
    } catch (error: any) {
      // 记录错误
      metrics.error = error.message
      console.error(`[API错误] ${req.method} ${req.url}:`, error)

      // 如果响应还没有发送，发送500错误
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '服务器内部错误'
          }
        })
      }
    }
  }
}

/**
 * 记录数据库查询性能
 */
export function recordDbQuery(
  requestId: string,
  operation: string,
  model: string,
  duration: number,
  args?: any
) {
  const metrics = performanceMetrics.get(requestId)
  if (metrics) {
    metrics.dbQueries.push({
      operation,
      model,
      duration,
      args: process.env.NODE_ENV === 'development' ? args : undefined
    })

    // 记录慢查询
    if (duration > 100) { // 超过100ms的查询
      console.warn(`[数据库慢查询] ${model}.${operation} - ${duration}ms`)
      if (process.env.NODE_ENV === 'development' && args) {
        console.warn(`[查询参数]`, JSON.stringify(args, null, 2))
      }
    }
  }
}

/**
 * 获取性能统计信息
 */
export function getPerformanceStats() {
  const metrics = Array.from(performanceMetrics.values())

  const stats = {
    totalRequests: metrics.length,
    averageResponseTime: metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length,
    slowRequests: metrics.filter(m => (m.duration || 0) > 1000).length,
    errorRequests: metrics.filter(m => m.error).length,
    totalDbQueries: metrics.reduce((sum, m) => sum + m.dbQueries.length, 0),
    slowDbQueries: metrics.reduce((sum, m) =>
      sum + m.dbQueries.filter(q => q.duration > 100).length, 0
    ),
    memoryUsage: process.memoryUsage(),
  }

  return stats
}

/**
 * 清理性能指标
 */
export function clearPerformanceMetrics() {
  performanceMetrics.clear()
}

/**
 * 获取最近的慢请求
 */
export function getSlowRequests(limit: number = 10) {
  const metrics = Array.from(performanceMetrics.values())
  return metrics
    .filter(m => (m.duration || 0) > 1000)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, limit)
    .map(m => ({
      requestId: m.requestId,
      method: m.method,
      url: m.url,
      duration: m.duration,
      statusCode: m.statusCode,
      dbQueries: m.dbQueries.length,
      slowDbQueries: m.dbQueries.filter(q => q.duration > 100).length,
      error: m.error,
    }))
}

/**
 * 获取最近的慢查询
 */
export function getSlowDbQueries(limit: number = 10) {
  const metrics = Array.from(performanceMetrics.values())
  const allQueries = metrics.flatMap(m =>
    m.dbQueries.map(q => ({
      ...q,
      requestId: m.requestId,
      requestUrl: m.url,
    }))
  )

  return allQueries
    .filter(q => q.duration > 100)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit)
}
