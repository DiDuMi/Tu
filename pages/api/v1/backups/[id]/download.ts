import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'
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

  // 只允许GET请求
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
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

  try {
    // 查询备份
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    })

    if (!backup) {
      return notFoundResponse(res, '备份不存在')
    }

    // 检查备份状态
    if (backup.status !== 'COMPLETED') {
      return errorResponse(
        res,
        'INVALID_BACKUP_STATUS',
        '只能下载已完成的备份',
        undefined,
        400
      )
    }

    // 检查备份文件是否存在
    const backupPath = path.join(BACKUP_DIR, backup.filename)
    if (!fs.existsSync(backupPath)) {
      return errorResponse(
        res,
        'BACKUP_FILE_NOT_FOUND',
        '备份文件不存在',
        undefined,
        400
      )
    }

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'BACKUP',
        action: 'DOWNLOAD',
        message: `下载系统备份: ${backup.filename}`,
        details: JSON.stringify(backup),
        userId: parseInt(session.user.id),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename=${backup.filename}`)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Length', backup.size)

    // 发送文件
    const fileStream = fs.createReadStream(backupPath)
    fileStream.pipe(res)
  } catch (error: any) {
    console.error('下载备份失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '下载备份失败',
      error.message,
      500
    )
  }
}
