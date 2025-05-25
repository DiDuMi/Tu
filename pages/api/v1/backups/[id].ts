import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// 备份目录
const BACKUP_DIR = path.join(process.cwd(), 'backups')

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

  // 获取备份ID
  const { id } = req.query

  if (!id || isNaN(Number(id))) {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的备份ID',
      undefined,
      400
    )
  }

  const backupId = parseInt(id as string)

  // 根据请求方法处理
  switch (req.method) {
    case 'GET':
      return getBackup(req, res, session, backupId)
    case 'DELETE':
      return deleteBackup(req, res, session, backupId)
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
 * 获取单个备份详情
 */
async function getBackup(req: NextApiRequest, res: NextApiResponse, session: any, id: number) {
  try {
    // 查询备份
    const backup = await prisma.systemBackup.findUnique({
      where: { id },
    })

    if (!backup) {
      return notFoundResponse(res, '备份不存在')
    }

    return successResponse(res, backup)
  } catch (error: any) {
    console.error('获取备份详情失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '获取备份详情失败',
      error.message,
      500
    )
  }
}

/**
 * 删除备份
 */
async function deleteBackup(req: NextApiRequest, res: NextApiResponse, session: any, id: number) {
  try {
    // 查询备份
    const backup = await prisma.systemBackup.findUnique({
      where: { id },
    })

    if (!backup) {
      return notFoundResponse(res, '备份不存在')
    }

    // 删除备份文件
    const filePath = path.join(BACKUP_DIR, backup.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // 删除备份记录
    await prisma.systemBackup.delete({
      where: { id },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'WARNING',
        module: 'BACKUP',
        action: 'DELETE',
        message: `删除系统备份: ${backup.filename}`,
        details: JSON.stringify(backup),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    return successResponse(res, null, '备份已删除')
  } catch (error: any) {
    console.error('删除备份失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '删除备份失败',
      error.message,
      500
    )
  }
}
