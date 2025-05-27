import { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getDeduplicationStats } from '@/lib/file-deduplication'

/**
 * 获取媒体文件去重统计信息API
 * 
 * GET /api/v1/media/deduplication-stats
 * 
 * 返回：
 * - 总唯一文件数
 * - 总媒体记录数
 * - 总引用数
 * - 节省的重复文件数
 * - 去重率
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '只允许GET请求',
      undefined,
      405
    )
  }

  try {
    // 获取去重统计信息
    const stats = await getDeduplicationStats()
    
    // 计算额外的统计信息
    const spaceSavedPercentage = stats.totalMediaRecords > 0 
      ? Math.round((stats.duplicatesSaved / stats.totalMediaRecords) * 100)
      : 0
    
    const response = {
      ...stats,
      spaceSavedPercentage,
      summary: {
        message: stats.duplicatesSaved > 0 
          ? `通过去重技术，共节省了 ${stats.duplicatesSaved} 个重复文件的存储空间，去重率达到 ${stats.deduplicationRate}%`
          : '暂无重复文件，去重系统运行正常',
        efficiency: stats.deduplicationRate > 20 ? '高效' : 
                   stats.deduplicationRate > 10 ? '中等' : '较低'
      }
    }

    return successResponse(res, response, '获取去重统计信息成功')
    
  } catch (error) {
    console.error('获取去重统计失败:', error)
    return errorResponse(
      res,
      'STATS_FETCH_FAILED',
      '获取去重统计信息失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))
