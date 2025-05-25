import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { isAdmin } from '@/lib/permissions'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 备份目录
const BACKUP_DIR = path.join(process.cwd(), 'backups')

// 临时目录
const TEMP_DIR = path.join(BACKUP_DIR, 'temp')

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

  // 只允许POST请求
  if (req.method !== 'POST') {
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
        '只能恢复已完成的备份',
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
        level: 'WARNING',
        module: 'BACKUP',
        action: 'RESTORE_START',
        message: `开始恢复系统备份: ${backup.filename}`,
        details: JSON.stringify(backup),
        userId: parseInt(session.user.id),
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    })

    // 异步执行恢复操作
    restoreBackup(backup, parseInt(session.user.id))
      .catch(error => console.error('恢复备份失败:', error))

    return successResponse(res, null, '备份恢复操作已启动')
  } catch (error: any) {
    console.error('恢复备份失败:', error)
    return errorResponse(
      res,
      'INTERNAL_SERVER_ERROR',
      '恢复备份失败',
      error.message,
      500
    )
  }
}

/**
 * 执行备份恢复操作
 */
async function restoreBackup(backup: any, userId: number) {
  // 确保临时目录存在
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  try {
    const backupPath = path.join(BACKUP_DIR, backup.filename)

    // 解压备份文件到临时目录
    await execAsync(`unzip -o "${backupPath}" -d "${TEMP_DIR}"`)

    // 根据备份类型执行不同的恢复操作
    switch (backup.type) {
      case 'FULL':
        await restoreFull()
        break
      case 'DATABASE':
        await restoreDatabase(backupPath)
        break
      case 'MEDIA':
        await restoreMedia(backupPath)
        break
      case 'SETTINGS':
        await restoreSettings(backupPath)
        break
    }

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'BACKUP',
        action: 'RESTORE_COMPLETE',
        message: `系统备份恢复完成: ${backup.filename}`,
        details: JSON.stringify(backup),
        userId,
      },
    })
  } catch (error: any) {
    console.error('恢复备份失败:', error)

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        module: 'BACKUP',
        action: 'RESTORE_FAILED',
        message: `系统备份恢复失败: ${backup.filename}`,
        details: JSON.stringify({ error: error.message }),
        userId,
      },
    })

    throw error
  } finally {
    // 清理临时目录
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

/**
 * 恢复完整备份
 */
async function restoreFull() {
  // 恢复数据库
  const databasePath = path.join(TEMP_DIR, 'database.sql')
  if (fs.existsSync(databasePath)) {
    await restoreDatabase(databasePath)
  }

  // 恢复媒体文件
  const mediaPath = path.join(TEMP_DIR, 'media')
  if (fs.existsSync(mediaPath)) {
    await restoreMedia(mediaPath)
  }

  // 恢复设置
  const settingsPath = path.join(TEMP_DIR, 'settings.json')
  if (fs.existsSync(settingsPath)) {
    await restoreSettings(settingsPath)
  }
}

/**
 * 恢复数据库
 */
async function restoreDatabase(filePath: string) {
  // 从环境变量获取数据库URL
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('数据库URL未配置')
  }

  // 根据数据库类型执行不同的恢复命令
  if (dbUrl.startsWith('mysql://')) {
    // MySQL恢复
    const { host, user, password, database } = parseMySQLUrl(dbUrl)
    await execAsync(
      `mysql -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} < "${filePath}"`
    )
  } else if (dbUrl.startsWith('sqlite:')) {
    // SQLite恢复
    const dbPath = dbUrl.replace('sqlite:', '').replace('file:', '')

    // 备份当前数据库
    const dbBackupPath = `${dbPath}.bak`
    fs.copyFileSync(dbPath, dbBackupPath)

    try {
      // 创建新数据库
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
      }

      // 恢复数据库
      await execAsync(`sqlite3 ${dbPath} < "${filePath}"`)
    } catch (error) {
      // 恢复失败，还原备份
      fs.copyFileSync(dbBackupPath, dbPath)
      throw error
    } finally {
      // 删除临时备份
      fs.unlinkSync(dbBackupPath)
    }
  } else {
    throw new Error('不支持的数据库类型')
  }
}

/**
 * 恢复媒体文件
 */
async function restoreMedia(filePath: string) {
  const publicDir = path.join(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, 'uploads')

  // 确保上传目录存在
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // 如果是ZIP文件，解压到上传目录
  if (filePath.endsWith('.zip')) {
    await execAsync(`unzip -o "${filePath}" -d "${uploadsDir}"`)
  } else {
    // 如果是目录，复制内容到上传目录
    await execAsync(`cp -R "${filePath}"/* "${uploadsDir}"`)
  }
}

/**
 * 恢复系统设置
 */
async function restoreSettings(filePath: string) {
  // 读取设置文件
  const settingsData = fs.readFileSync(filePath, 'utf-8')
  const settings = JSON.parse(settingsData)

  // 清空当前设置
  await prisma.systemSetting.deleteMany()

  // 恢复设置
  for (const setting of settings) {
    await prisma.systemSetting.create({
      data: {
        key: setting.key,
        value: setting.value,
        type: setting.type,
        group: setting.group,
        description: setting.description,
      },
    })
  }
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
