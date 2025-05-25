import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './[...nextauth]'
import { prisma } from '@/lib/prisma'
import { verifyTelegramAuth, processTelegramLoginData } from '@/lib/telegram-provider'
import { successResponse, errorResponse } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { telegramData } = req.body

    if (!telegramData) {
      return errorResponse(res, 'MISSING_DATA', '缺少Telegram登录数据', undefined, 400)
    }

    // 验证Telegram数据
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return errorResponse(res, 'CONFIG_ERROR', 'Telegram配置错误', undefined, 500)
    }

    // 验证数据完整性
    if (!verifyTelegramAuth(telegramData, botToken)) {
      return errorResponse(res, 'INVALID_AUTH', 'Telegram认证数据无效', undefined, 400)
    }

    // 处理登录数据
    const userData = processTelegramLoginData(telegramData)

    // 获取当前会话
    const session = await getServerSession(req, res, authOptions)

    if (session?.user) {
      // 用户已登录，关联Telegram账号
      const userId = parseInt(session.user.id)

      // 检查是否已关联
      const existingSocialAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'telegram'
          }
        }
      })

      if (existingSocialAccount) {
        return errorResponse(res, 'ALREADY_LINKED', '该账号已关联Telegram', undefined, 400)
      }

      // 检查Telegram账号是否被其他用户使用
      const existingTelegramAccount = await prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider: 'telegram',
            providerId: userData.id.toString()
          }
        }
      })

      if (existingTelegramAccount) {
        return errorResponse(res, 'TELEGRAM_ALREADY_USED', '该Telegram账号已被其他用户关联', undefined, 400)
      }

      // 创建关联
      const socialAccount = await prisma.socialAccount.create({
        data: {
          userId,
          provider: 'telegram',
          providerId: userData.id.toString(),
          username: userData.username,
          displayName: `${userData.first_name}${userData.last_name ? ` ${userData.last_name}` : ''}`,
          avatar: userData.photo_url,
          metadata: JSON.stringify({
            first_name: userData.first_name,
            last_name: userData.last_name,
            auth_date: userData.auth_date
          }),
          isVerified: true,
        }
      })

      return successResponse(res, socialAccount, 'Telegram账号关联成功')
    } else {
      // 用户未登录，尝试通过Telegram登录
      
      // 查找已关联的用户
      const socialAccount = await prisma.socialAccount.findUnique({
        where: {
          provider_providerId: {
            provider: 'telegram',
            providerId: userData.id.toString()
          }
        },
        include: {
          user: true
        }
      })

      if (!socialAccount) {
        return errorResponse(res, 'ACCOUNT_NOT_FOUND', '未找到关联的账号，请先注册并关联Telegram', undefined, 404)
      }

      // 检查用户状态
      if (socialAccount.user.status !== 'ACTIVE') {
        return errorResponse(res, 'ACCOUNT_INACTIVE', '账户未激活或已被禁用', undefined, 403)
      }

      // 更新社交账号信息
      await prisma.socialAccount.update({
        where: { id: socialAccount.id },
        data: {
          username: userData.username,
          displayName: `${userData.first_name}${userData.last_name ? ` ${userData.last_name}` : ''}`,
          avatar: userData.photo_url,
          metadata: JSON.stringify({
            first_name: userData.first_name,
            last_name: userData.last_name,
            auth_date: userData.auth_date
          }),
        }
      })

      return successResponse(res, {
        user: {
          id: socialAccount.user.id,
          email: socialAccount.user.email,
          name: socialAccount.user.name,
          role: socialAccount.user.role,
          image: socialAccount.user.image || userData.photo_url,
        }
      }, 'Telegram登录成功')
    }
  } catch (error) {
    console.error('Telegram登录错误:', error)
    return errorResponse(res, 'SERVER_ERROR', '登录过程中发生错误', undefined, 500)
  }
}
