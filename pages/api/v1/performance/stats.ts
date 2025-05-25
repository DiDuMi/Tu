import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { 
  getPerformanceStats, 
  getSlowRequests, 
  getSlowDbQueries,
  clearPerformanceMetrics 
} from '@/lib/performance-middleware'
import { successResponse, errorResponse } from '@/lib/api'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  // 只有管理员可以访问性能统计
  if (!session || session.user.role !== 'ADMIN') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '无权访问性能统计',
      undefined,
      403
    )
  }

  if (req.method === 'GET') {
    try {
      const stats = getPerformanceStats()
      const slowRequests = getSlowRequests(10)
      const slowDbQueries = getSlowDbQueries(10)

      return successResponse(res, {
        stats,
        slowRequests,
        slowDbQueries,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('获取性能统计失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取性能统计失败',
        undefined,
        500
      )
    }
  }

  if (req.method === 'DELETE') {
    try {
      clearPerformanceMetrics()
      return successResponse(res, null, '性能统计已清理')
    } catch (error) {
      console.error('清理性能统计失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '清理性能统计失败',
        undefined,
        500
      )
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } 
  })
}

export default handler
