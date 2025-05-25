import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'

export interface TelegramProfile {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export default function TelegramProvider<P extends TelegramProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: 'telegram',
    name: 'Telegram',
    type: 'oauth',
    authorization: {
      url: 'https://oauth.telegram.org/auth',
      params: {
        bot_id: process.env.TELEGRAM_BOT_TOKEN?.split(':')[0],
        origin: process.env.NEXTAUTH_URL,
        embed: '1',
        request_access: 'write',
        return_to: `${process.env.NEXTAUTH_URL}/api/auth/callback/telegram`,
      },
    },
    token: {
      url: 'https://oauth.telegram.org/auth/request',
    },
    userinfo: {
      url: 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/getMe',
    },
    profile(profile: P) {
      return {
        id: profile.id.toString(),
        name: `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ''}`,
        email: null, // Telegram doesn't provide email
        image: profile.photo_url,
        username: profile.username,
      }
    },
    style: {
      logo: '/images/telegram-logo.svg',
      logoDark: '/images/telegram-logo.svg',
      bg: '#0088cc',
      text: '#fff',
      bgDark: '#0088cc',
      textDark: '#fff',
    },
    options,
  }
}

// Telegram Widget验证函数
export function verifyTelegramAuth(authData: any, botToken: string): boolean {
  const crypto = require('crypto')
  
  // 提取hash
  const { hash, ...data } = authData
  
  // 创建数据字符串
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n')
  
  // 创建密钥
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  
  // 计算HMAC
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  
  // 验证hash
  return hmac === hash
}

// Telegram Login Widget数据处理
export function processTelegramLoginData(query: any) {
  const requiredFields = ['id', 'first_name', 'auth_date', 'hash']
  
  // 检查必需字段
  for (const field of requiredFields) {
    if (!query[field]) {
      throw new Error(`Missing required field: ${field}`)
    }
  }
  
  // 检查auth_date是否在合理时间范围内（5分钟）
  const authDate = parseInt(query.auth_date)
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 300) {
    throw new Error('Auth data is too old')
  }
  
  return {
    id: parseInt(query.id),
    first_name: query.first_name,
    last_name: query.last_name || undefined,
    username: query.username || undefined,
    photo_url: query.photo_url || undefined,
    auth_date: authDate,
    hash: query.hash,
  }
}
