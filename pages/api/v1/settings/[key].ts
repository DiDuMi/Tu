import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取用户会话
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录
  if (!session) {
    return unauthorizedResponse(res)
  }

  // 获取设置键
  const { key } = req.query

  if (!key || typeof key !== 'string') {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的设置键',
      undefined,
      400
    )
  }

  // 根据请求方法处理
  switch (req.method) {
    case 'GET':
      return getSetting(req, res, session, key)
    case 'PUT':
      return updateSetting(req, res, session, key)
    case 'DELETE':
      return deleteSetting(req, res, session, key)
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
 * 获取单个系统设置
 */
async function getSetting(req: NextApiRequest, res: NextApiResponse, session: any, key: string) {
  try {
    // 查询系统设置
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    if (!setting) {
      return notFoundResponse(res, '系统设置不存在')
    }

    return successResponse(res, setting)
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
 * 更新系统设置
 */
async function updateSetting(req: NextApiRequest, res: NextApiResponse, session: any, key: string) {
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
    const { value } = req.body

    // 验证必填字段
    if (value === undefined) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '缺少必填字段',
        undefined,
        400
      )
    }

    // 检查设置是否存在
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    if (!existingSetting) {
      return notFoundResponse(res, '系统设置不存在')
    }

    // 更新系统设置
    const setting = await prisma.systemSetting.update({
      where: { key },
      data: { value },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'SETTINGS',
        action: 'UPDATE',
        message: `更新系统设置: ${key}`,
        details: JSON.stringify({
          oldValue: existingSetting.value,
          newValue: value
        }),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    return successResponse(res, setting, '系统设置更新成功')
  } catch (error: any) {
    console.error('更新系统设置失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '更新系统设置失败',
      error.message,
      500
    )
  }
}

/**
 * 删除系统设置
 */
async function deleteSetting(req: NextApiRequest, res: NextApiResponse, session: any, key: string) {
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
    // 检查设置是否存在
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key },
    })

    if (!existingSetting) {
      return notFoundResponse(res, '系统设置不存在')
    }

    // 删除系统设置
    await prisma.systemSetting.delete({
      where: { key },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'WARNING',
        module: 'SETTINGS',
        action: 'DELETE',
        message: `删除系统设置: ${key}`,
        details: JSON.stringify(existingSetting),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    return successResponse(res, null, '系统设置删除成功')
  } catch (error: any) {
    console.error('删除系统设置失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '删除系统设置失败',
      error.message,
      500
    )
  }
}
