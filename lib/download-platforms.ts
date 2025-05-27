// 网盘平台配置
export interface DownloadPlatform {
  id: string
  name: string
  icon: string
  color: string
  description: string
  needsExtractCode: boolean
  urlPattern?: RegExp
  features: string[]
}

export const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '📱',
    color: 'bg-blue-500',
    description: '即时下载，无需提取码',
    needsExtractCode: false,
    urlPattern: /^https?:\/\/(t\.me|telegram\.me)\/.+/,
    features: ['即时下载', '无限速', '稳定可靠']
  },
  {
    id: 'baidu',
    name: '百度网盘',
    icon: '☁️',
    color: 'bg-blue-600',
    description: '大容量存储，需要提取码',
    needsExtractCode: true,
    urlPattern: /^https?:\/\/pan\.baidu\.com\/.+/,
    features: ['大容量', '长期保存', '需要客户端']
  },
  {
    id: 'aliyun',
    name: '阿里云盘',
    icon: '🌐',
    color: 'bg-orange-500',
    description: '高速下载，免费大容量',
    needsExtractCode: true,
    urlPattern: /^https?:\/\/www\.aliyundrive\.com\/.+/,
    features: ['高速下载', '免费容量大', '不限速']
  },
  {
    id: 'quark',
    name: '夸克网盘',
    icon: '⚡',
    color: 'bg-purple-500',
    description: '极速下载，智能管理',
    needsExtractCode: true,
    urlPattern: /^https?:\/\/pan\.quark\.cn\/.+/,
    features: ['极速下载', '智能分类', '安全可靠']
  },
  {
    id: 'xunlei',
    name: '迅雷网盘',
    icon: '⚡',
    color: 'bg-blue-700',
    description: '下载加速，会员高速',
    needsExtractCode: true,
    urlPattern: /^https?:\/\/pan\.xunlei\.com\/.+/,
    features: ['下载加速', '离线下载', '会员高速']
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '☁️',
    color: 'bg-blue-400',
    description: '微软云盘，全球同步',
    needsExtractCode: false,
    urlPattern: /^https?:\/\/1drv\.ms\/.+/,
    features: ['全球同步', 'Office集成', '安全可靠']
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    icon: '📁',
    color: 'bg-green-500',
    description: '谷歌云盘，全球访问',
    needsExtractCode: false,
    urlPattern: /^https?:\/\/drive\.google\.com\/.+/,
    features: ['全球访问', '协作编辑', '大容量']
  },
  {
    id: 'mega',
    name: 'MEGA',
    icon: '🔒',
    color: 'bg-red-500',
    description: '端到端加密，隐私保护',
    needsExtractCode: false,
    urlPattern: /^https?:\/\/mega\.nz\/.+/,
    features: ['端到端加密', '隐私保护', '免费50GB']
  },
  {
    id: 'other',
    name: '其他网盘',
    icon: '📦',
    color: 'bg-gray-500',
    description: '其他网盘平台',
    needsExtractCode: true,
    features: ['自定义平台']
  }
]

/**
 * 根据ID获取平台信息
 */
export function getPlatformById(id: string): DownloadPlatform | undefined {
  return DOWNLOAD_PLATFORMS.find(platform => platform.id === id)
}

/**
 * 根据URL自动检测平台类型
 */
export function detectPlatformByUrl(url: string): DownloadPlatform | undefined {
  for (const platform of DOWNLOAD_PLATFORMS) {
    if (platform.urlPattern && platform.urlPattern.test(url)) {
      return platform
    }
  }
  return getPlatformById('other')
}

/**
 * 验证URL格式
 */
export function validateDownloadUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 获取平台图标组件属性
 */
export function getPlatformIconProps(platformId: string) {
  const platform = getPlatformById(platformId)
  if (!platform) return { icon: '📦', color: 'bg-gray-500' }
  
  return {
    icon: platform.icon,
    color: platform.color,
    name: platform.name
  }
}
