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
    // 获取用户总数
    const total = await prisma.user.count({
      where: {
        deletedAt: null,
      },
    })

    // 获取活跃用户数
    const active = await prisma.user.count({
      where: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    })

    // 获取待审核用户数
    const pending = await prisma.user.count({
      where: {
        deletedAt: null,
        status: 'PENDING',
      },
    })

    // 获取已禁用用户数
    const suspended = await prisma.user.count({
      where: {
        deletedAt: null,
        status: 'SUSPENDED',
      },
    })

    // 按角色统计用户数 (SQLite兼容版本)
    const roleStats = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count
      FROM User
      WHERE deletedAt IS NULL
      GROUP BY role
    `

    return successResponse(res, {
      total,
      active,
      pending,
      suspended,
      roleStats,
    })
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '获取用户统计数据失败',
      undefined,
      500
    )
  }
}

export default withErrorHandler(withOperator(handler))
