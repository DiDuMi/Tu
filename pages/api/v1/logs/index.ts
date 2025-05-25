import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse, paginatedResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return unauthorizedResponse(res)
  }

  // 检查用户是否有权限
  if (!isAdmin(session)) {
    return errorResponse(
      res,
      'FORBIDDEN',
      '您没有权限执行此操作',
      undefined,
      403
    )
  }

  // 根据请求方法处理
  switch (req.method) {
    case 'GET':
      return getLogs(req, res, session)
    case 'DELETE':
      return clearLogs(req, res, session)
    default:
      return errorResponse(
        res,
        'METHOD_NOT_ALLOWED',
        '不支持的请求方法',
        undefined,
        405
      )
  }
}

/**
 * 获取系统日志
 */
async function getLogs(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 获取分页参数
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // 获取筛选参数
    const { level, module, action, startDate, endDate } = req.query

    // 构建查询条件
    const where: any = {}

    if (level) {
      where.level = level
    }

    if (module) {
      where.module = {
        contains: module,
      }
    }

    if (action) {
      where.action = {
        contains: action,
      }
    }

    // 日期筛选
    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }

      if (endDate) {
        // 设置结束日期为当天的最后一毫秒
        const endDateTime = new Date(endDate as string)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // 查询日志总数
    const total = await prisma.systemLog.count({ where })

    // 查询日志列表
    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    return paginatedResponse(res, logs, total, page, limit)
  } catch (error: any) {
    console.error('获取系统日志失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '获取系统日志失败',
      error.message,
      500
    )
  }
}

/**
 * 清除系统日志
 */
async function clearLogs(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 获取筛选参数
    const { level, module, action, startDate, endDate } = req.query

    // 构建查询条件
    const where: any = {}

    if (level) {
      where.level = level
    }

    if (module) {
      where.module = {
        contains: module,
      }
    }

    if (action) {
      where.action = {
        contains: action,
      }
    }

    // 日期筛选
    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }

      if (endDate) {
        // 设置结束日期为当天的最后一毫秒
        const endDateTime = new Date(endDate as string)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    // 删除日志
    const { count } = await prisma.systemLog.deleteMany({ where })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'WARNING',
        module: 'SYSTEM',
        action: 'CLEAR_LOGS',
        message: `清除系统日志: ${count}条`,
        details: JSON.stringify({ filters: req.query }),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    return successResponse(res, { count }, `成功清除${count}条日志`)
  } catch (error: any) {
    console.error('清除系统日志失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '清除系统日志失败',
      error.message,
      500
    )
  }
}
