/**
 * 封面图片工具函数
 */

interface MediaItem {
  id: number
  uuid: string
  title: string
  url: string
  type: string
  mimeType?: string
  width?: number
  height?: number
}

/**
 * 从内容中提取第一张图片作为封面
 * @param content HTML内容
 * @returns 图片URL或null
 */
export function extractFirstImageFromContent(content: string): string | null {
  if (!content) return null

  // 创建临时DOM元素来解析HTML
  if (typeof window !== 'undefined') {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // 查找第一张图片
    const firstImg = tempDiv.querySelector('img')
    if (firstImg && firstImg.src) {
      return firstImg.src
    }
  } else {
    // 服务端环境，使用正则表达式
    const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i
    const match = content.match(imgRegex)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 从媒体列表中提取第一张图片作为封面
 * @param mediaList 媒体列表
 * @returns 图片URL或null
 */
export function extractFirstImageFromMedia(mediaList: MediaItem[]): string | null {
  if (!mediaList || mediaList.length === 0) return null

  // 查找第一张图片类型的媒体
  const firstImage = mediaList.find(media => 
    media.type === 'IMAGE' || 
    (media.mimeType && media.mimeType.startsWith('image/'))
  )

  return firstImage ? firstImage.url : null
}

/**
 * 验证图片URL是否有效
 * @param url 图片URL
 * @returns Promise<boolean>
 */
export function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false)
      return
    }

    // 在浏览器环境中验证
    if (typeof window !== 'undefined') {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    } else {
      // 服务端环境，简单验证URL格式
      try {
        const urlObj = new URL(url)
        const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
        const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname)
        resolve(isValidProtocol && (hasImageExtension || urlObj.pathname.includes('image')))
      } catch {
        resolve(false)
      }
    }
  })
}

/**
 * 获取图片的尺寸信息
 * @param url 图片URL
 * @returns Promise<{width: number, height: number} | null>
 */
export function getImageDimensions(url: string): Promise<{width: number, height: number} | null> {
  return new Promise((resolve) => {
    if (!url || typeof window === 'undefined') {
      resolve(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * 生成缩略图URL（如果支持）
 * @param originalUrl 原始图片URL
 * @param width 目标宽度
 * @param height 目标高度
 * @returns 缩略图URL
 */
export function generateThumbnailUrl(
  originalUrl: string, 
  width: number = 300, 
  height: number = 200
): string {
  if (!originalUrl) return ''

  // 如果是本地上传的图片，可以添加缩略图参数
  if (originalUrl.includes('/api/v1/media/') || originalUrl.includes('/uploads/')) {
    const separator = originalUrl.includes('?') ? '&' : '?'
    return `${originalUrl}${separator}w=${width}&h=${height}&fit=cover`
  }

  // 对于外部图片，直接返回原URL
  return originalUrl
}

/**
 * 检查是否为支持的图片格式
 * @param mimeType MIME类型
 * @returns boolean
 */
export function isSupportedImageFormat(mimeType: string): boolean {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
  
  return supportedFormats.includes(mimeType.toLowerCase())
}

/**
 * 从文件名获取图片格式
 * @param filename 文件名
 * @returns MIME类型或null
 */
export function getImageMimeTypeFromFilename(filename: string): string | null {
  if (!filename) return null

  const extension = filename.toLowerCase().split('.').pop()
  
  const mimeTypeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }

  return mimeTypeMap[extension || ''] || null
}
