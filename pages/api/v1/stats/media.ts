import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET方法
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  try {
    // 获取媒体总数
    const total = await prisma.media.count({
      where: {
        deletedAt: null,
      },
    })

    // 获取图片数量
    const images = await prisma.media.count({
      where: {
        deletedAt: null,
        type: 'IMAGE',
      },
    })

    // 获取视频数量
    const videos = await prisma.media.count({
      where: {
        deletedAt: null,
        type: 'VIDEO',
      },
    })

    // 获取云视频数量
    const cloudVideos = await prisma.media.count({
      where: {
        deletedAt: null,
        type: 'CLOUD_VIDEO',
      },
    })

    // 获取最近一周媒体上传趋势 (SQLite兼容版本)
    const lastWeekTrend = await prisma.$queryRaw`
      SELECT date(createdAt) as date, COUNT(*) as count
      FROM Media
      WHERE deletedAt IS NULL
        AND createdAt >= date('now', '-7 days')
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `

    return successResponse(res, {
      total,
      images,
      videos,
      cloudVideos,
      lastWeekTrend,
    })
  } catch (error) {
    console.error('获取媒体统计数据失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '获取媒体统计数据失败',
      undefined,
      500
    )
  }
}

export default withErrorHandler(withOperator(handler))
