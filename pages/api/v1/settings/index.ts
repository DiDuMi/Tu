import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return unauthorizedResponse(res)
  }

  // 根据请求方法处理
  switch (req.method) {
    case 'GET':
      return getSettings(req, res, session)
    case 'POST':
      return createSetting(req, res, session)
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
 * 获取系统设置
 */
async function getSettings(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 获取查询参数
    const { group } = req.query

    // 构建查询条件
    const where = group ? { group: group as string } : {}

    // 查询系统设置
    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [
        { group: 'asc' },
        { key: 'asc' },
      ],
    })

    return successResponse(res, settings)
  } catch (error: any) {
    console.error('获取系统设置失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '获取系统设置失败',
      error.message,
      500
    )
  }
}

/**
 * 创建系统设置
 */
async function createSetting(req: NextApiRequest, res: NextApiResponse, session: any) {
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

  try {
    const { key, value, type, group, description } = req.body

    // 验证必填字段
    if (!key || !value || !type || !group) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '缺少必填字段',
        undefined,
        400
      )
    }

    // 检查键是否已存在
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    if (existingSetting) {
      return errorResponse(
        res,
        'DUPLICATE_KEY',
        '设置键已存在',
        undefined,
        400
      )
    }

    // 创建系统设置
    const setting = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type,
        group,
        description,
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'SETTINGS',
        action: 'CREATE',
        message: `创建系统设置: ${key}`,
        details: JSON.stringify({ setting }),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    return successResponse(res, setting, '系统设置创建成功', 201)
  } catch (error: any) {
    console.error('创建系统设置失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '创建系统设置失败',
      error.message,
      500
    )
  }
}
