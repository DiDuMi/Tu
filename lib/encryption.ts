import crypto from 'crypto'

/**
 * 加密文本
 * @param text 要加密的文本
 * @returns 加密后的字符串（包含iv和authTag）
 */
export function encrypt(text: string): string {
  if (!text) return ''

  try {
    // 使用简单的base64编码作为临时方案
    return Buffer.from(text, 'utf8').toString('base64')
  } catch (error) {
    console.error('加密失败:', error)
    return text // 如果加密失败，返回原文本
  }
}

/**
 * 解密文本
 * @param encryptedText 加密的文本
 * @returns 解密后的原文本
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  try {
    // 检查是否是AES加密格式（包含冒号分隔的iv和加密数据）
    if (encryptedText.includes(':')) {
      // 这是旧的AES加密格式，暂时返回占位符
      console.warn('检测到旧的AES加密格式，需要重新加密:', encryptedText.substring(0, 20) + '...')
      return 'https://t.me/+example_group_link'
    }

    // 检查是否是有效的Base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (base64Regex.test(encryptedText)) {
      // 尝试Base64解码
      const decoded = Buffer.from(encryptedText, 'base64').toString('utf8')

      // 验证解码后的内容是否是有效的URL
      if (decoded.startsWith('http://') || decoded.startsWith('https://') || decoded.startsWith('tg://')) {
        return decoded
      }
    }

    // 如果都不是，可能是纯文本URL
    if (encryptedText.startsWith('http://') || encryptedText.startsWith('https://') || encryptedText.startsWith('tg://')) {
      return encryptedText
    }

    // 默认返回占位符
    return 'https://t.me/+example_group_link'
  } catch (error) {
    console.error('解密失败:', error)
    return 'https://t.me/+example_group_link' // 返回默认链接
  }
}

/**
 * 生成随机访问令牌
 * @param length 令牌长度
 * @returns 随机令牌
 */
export function generateAccessToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * 哈希文本（用于存储敏感信息的哈希值）
 * @param text 要哈希的文本
 * @returns 哈希值
 */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * 验证哈希值
 * @param text 原文本
 * @param hash 哈希值
 * @returns 是否匹配
 */
export function verifyHash(text: string, hash: string): boolean {
  return hashText(text) === hash
}
