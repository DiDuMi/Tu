import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 备份目录
const BACKUP_DIR = path.join(process.cwd(), 'backups')

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

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
      return getBackups(req, res, session)
    case 'POST':
      return createBackup(req, res, session)
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
 * 获取系统备份列表
 */
async function getBackups(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    // 查询备份列表
    const backups = await prisma.systemBackup.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(res, backups)
  } catch (error: any) {
    console.error('获取系统备份失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '获取系统备份失败',
      error.message,
      500
    )
  }
}

/**
 * 创建系统备份
 */
async function createBackup(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const { type, notes } = req.body

    // 验证备份类型
    if (!['FULL', 'DATABASE', 'MEDIA', 'SETTINGS'].includes(type)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '无效的备份类型',
        undefined,
        400
      )
    }

    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup_${type.toLowerCase()}_${timestamp}.zip`
    const filePath = path.join(BACKUP_DIR, filename)

    // 创建备份记录
    const backup = await prisma.systemBackup.create({
      data: {
        filename,
        size: 0, // 初始大小为0
        type,
        status: 'PENDING',
        notes,
        createdById: parseInt(session.user.id),
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'BACKUP',
        action: 'CREATE',
        message: `创建系统备份: ${type}`,
        details: JSON.stringify({ backup }),
        userId: session.user.id,
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    // 异步执行备份操作
    performBackup(backup.id, type, filePath, session.user.id)
      .catch(error => console.error('执行备份失败:', error))

    return successResponse(res, backup, '备份任务已创建', 201)
  } catch (error: any) {
    console.error('创建系统备份失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '创建系统备份失败',
      error.message,
      500
    )
  }
}

/**
 * 执行备份操作
 */
async function performBackup(backupId: number, type: string, filePath: string, userId: number) {
  try {
    // 根据备份类型执行不同的备份操作
    switch (type) {
      case 'FULL':
        await backupFull(filePath)
        break
      case 'DATABASE':
        await backupDatabase(filePath)
        break
      case 'MEDIA':
        await backupMedia(filePath)
        break
      case 'SETTINGS':
        await backupSettings(filePath)
        break
    }

    // 获取文件大小
    const stats = fs.statSync(filePath)

    // 更新备份记录
    await prisma.systemBackup.update({
      where: { id: backupId },
      data: {
        size: stats.size,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'BACKUP',
        action: 'COMPLETE',
        message: `系统备份完成: ${type}`,
        details: JSON.stringify({ backupId, size: stats.size }),
        userId,
      },
    })
  } catch (error: any) {
    console.error('备份操作失败:', error)

    // 更新备份记录为失败状态
    await prisma.systemBackup.update({
      where: { id: backupId },
      data: {
        status: 'FAILED',
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        module: 'BACKUP',
        action: 'FAILED',
        message: `系统备份失败: ${type}`,
        details: JSON.stringify({ backupId, error: error.message }),
        userId,
      },
    })
  }
}

/**
 * 完整备份
 */
async function backupFull(filePath: string) {
  // 创建临时目录
  const tempDir = path.join(BACKUP_DIR, 'temp_' + Date.now())
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    // 备份数据库
    await backupDatabase(path.join(tempDir, 'database.sql'))

    // 备份媒体文件
    const mediaDir = path.join(tempDir, 'media')
    fs.mkdirSync(mediaDir, { recursive: true })
    await backupMedia(mediaDir)

    // 备份设置
    await backupSettings(path.join(tempDir, 'settings.json'))

    // 创建ZIP文件
    await execAsync(`zip -r "${filePath}" .`, { cwd: tempDir })
  } finally {
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

/**
 * 数据库备份
 */
async function backupDatabase(filePath: string) {
  // 从环境变量获取数据库URL
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('数据库URL未配置')
  }

  // 根据数据库类型执行不同的备份命令
  if (dbUrl.startsWith('mysql://')) {
    // MySQL备份
    const { host, user, password, database } = parseMySQLUrl(dbUrl)
    await execAsync(
      `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} > "${filePath}"`
    )
  } else if (dbUrl.startsWith('sqlite:')) {
    // SQLite备份
    const dbPath = dbUrl.replace('sqlite:', '').replace('file:', '')
    await execAsync(`sqlite3 ${dbPath} .dump > "${filePath}"`)
  } else {
    throw new Error('不支持的数据库类型')
  }
}

/**
 * 媒体文件备份
 */
async function backupMedia(filePath: string) {
  const publicDir = path.join(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, 'uploads')

  if (fs.existsSync(uploadsDir)) {
    await execAsync(`zip -r "${filePath}" .`, { cwd: uploadsDir })
  } else {
    // 如果上传目录不存在，创建一个空的ZIP文件
    await execAsync(`zip -r "${filePath}" -i /dev/null`)
  }
}

/**
 * 系统设置备份
 */
async function backupSettings(filePath: string) {
  // 查询所有系统设置
  const settings = await prisma.systemSetting.findMany()

  // 将设置写入JSON文件
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2))
}

/**
 * 解析MySQL URL
 */
function parseMySQLUrl(url: string) {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  const match = url.match(regex)

  if (!match) {
    throw new Error('无效的MySQL URL')
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  }
}
