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
    // 获取内容总数
    const total = await prisma.page.count({
      where: {
        deletedAt: null,
      },
    })

    // 获取已发布内容数
    const published = await prisma.page.count({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
      },
    })

    // 获取草稿内容数
    const draft = await prisma.page.count({
      where: {
        deletedAt: null,
        status: 'DRAFT',
      },
    })

    // 获取精选内容数
    const featured = await prisma.page.count({
      where: {
        deletedAt: null,
        featured: true,
      },
    })

    // 获取最近一周内容创建趋势 (SQLite兼容版本)
    const lastWeekTrend = await prisma.$queryRaw`
      SELECT date(createdAt) as date, COUNT(*) as count
      FROM Page
      WHERE deletedAt IS NULL
        AND createdAt >= date('now', '-7 days')
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `

    return successResponse(res, {
      total,
      published,
      draft,
      featured,
      lastWeekTrend,
    })
  } catch (error) {
    console.error('获取内容统计数据失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '获取内容统计数据失败',
      undefined,
      500
    )
  }
}

export default withErrorHandler(withOperator(handler))
