// 重新导出所有媒体处理功能
export * from './media-types'
export * from './image-processing'
export * from './video-processing'

import { MediaResponse } from '@/types/api'
import { MediaType, getMediaTypeFromExtension, formatFileSize, getFileSizeLimit } from './media-types'

/**
 * 媒体处理工具函数
 */

/**
 * 创建媒体响应对象
 */
export function createMediaResponse(
  id: number,
  filename: string,
  originalName: string,
  size: number,
  mimeType: string,
  path: string
): MediaResponse {
  const mediaType = getMediaTypeFromExtension(originalName)

  return {
    id,
    filename,
    originalName,
    size,
    formattedSize: formatFileSize(size),
    mimeType,
    mediaType: mediaType || MediaType.IMAGE,
    path,
    url: `/uploads/${filename}`,
    createdAt: new Date().toISOString(),
  }
}

/**
 * 获取媒体类型
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) {
    return MediaType.IMAGE
  } else if (mimeType.startsWith('video/')) {
    return MediaType.VIDEO
  } else if (mimeType.startsWith('audio/')) {
    return MediaType.AUDIO
  } else if (
    mimeType === 'application/vnd.apple.mpegurl' ||
    mimeType === 'application/x-mpegURL' ||
    mimeType === 'application/dash+xml'
  ) {
    return MediaType.CLOUD_VIDEO
  }
  return MediaType.IMAGE
}

/**
 * 获取媒体文件的存储路径
 */
export function getMediaStoragePath(userId: number, filename: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `public/uploads/media/${year}${month}${day}/${userId}/${filename}`
}

/**
 * 获取媒体文件的URL路径
 */
export function getMediaUrl(storagePath: string): string {
  return storagePath.replace(/^public/, '').replace(/\\/g, '/')
}

/**
 * 格式化媒体信息
 */
export function formatMediaInfo(media: any): MediaResponse {
  const latestVersion = media.versions?.[0]

  return {
    id: media.id,
    uuid: media.uuid,
    type: media.type,
    url: media.url,
    title: media.title || null,
    description: media.description || null,
    fileSize: media.fileSize || null,
    mimeType: media.mimeType || null,
    width: media.width || null,
    height: media.height || null,
    duration: media.duration || null,
    thumbnailUrl: latestVersion?.thumbnailUrl || null,
    storageType: media.storageType || 'LOCAL',
    status: media.status || 'ACTIVE',
    usageCount: media.usageCount || 0,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    user: media.user ? {
      id: media.user.id,
      name: media.user.name,
    } : undefined,
    category: media.category ? {
      id: media.category.id,
      uuid: media.category.uuid,
      name: media.category.name,
      slug: media.category.slug,
    } : undefined,
    tags: media.mediaTags ? media.mediaTags.map((mediaTag: any) => ({
      id: mediaTag.tag.id,
      uuid: mediaTag.tag.uuid,
      name: mediaTag.tag.name,
      color: mediaTag.tag.color,
    })) : undefined,
  }
}

/**
 * 验证媒体文件
 */
export function validateMediaFile(filename: string, size: number): {
  valid: boolean
  error?: string
} {
  const mediaType = getMediaTypeFromExtension(filename)

  if (!mediaType) {
    return {
      valid: false,
      error: '不支持的文件格式'
    }
  }

  const sizeLimit = getFileSizeLimit(mediaType)
  if (size > sizeLimit) {
    return {
      valid: false,
      error: `文件大小超过限制，最大允许 ${formatFileSize(sizeLimit)}`
    }
  }

  return { valid: true }
}

// 所有处理函数已移至专门的模块文件中