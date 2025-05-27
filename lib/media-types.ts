/**
 * 媒体类型枚举
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  CLOUD_VIDEO = 'CLOUD_VIDEO',
}

/**
 * 支持的图片格式
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff'
] as const

/**
 * 支持的视频格式
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'ogv'
] as const

/**
 * 支持的音频格式
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'
] as const

/**
 * 文件大小限制（字节）
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 50 * 1024 * 1024, // 50MB
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  AUDIO: 100 * 1024 * 1024, // 100MB
} as const

/**
 * 默认处理选项
 */
export const DEFAULT_IMAGE_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp' as const,
  fit: 'inside' as const,
}

export const DEFAULT_VIDEO_OPTIONS = {
  maxWidth: 1280,
  maxHeight: 720,
  quality: 23,
  format: 'mp4' as const,
  codec: 'h264' as const,
  audioCodec: 'aac' as const,
  audioBitrate: '128k',
  preset: 'medium' as const,
  fastStart: true,
}

/**
 * 缩略图默认选项
 */
export const DEFAULT_THUMBNAIL_OPTIONS = {
  width: 300,
  height: 300,
  quality: 70,
  fit: 'cover' as const,
  format: 'webp' as const,
}

/**
 * 根据文件扩展名判断媒体类型
 */
export function getMediaTypeFromExtension(filename: string): MediaType | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (!ext) return null

  if (SUPPORTED_IMAGE_FORMATS.includes(ext as any)) {
    return MediaType.IMAGE
  }
  
  if (SUPPORTED_VIDEO_FORMATS.includes(ext as any)) {
    return MediaType.VIDEO
  }
  
  if (SUPPORTED_AUDIO_FORMATS.includes(ext as any)) {
    return MediaType.AUDIO
  }

  return null
}

/**
 * 检查文件是否为支持的格式
 */
export function isSupportedFormat(filename: string): boolean {
  return getMediaTypeFromExtension(filename) !== null
}

/**
 * 获取文件大小限制
 */
export function getFileSizeLimit(mediaType: MediaType): number {
  return FILE_SIZE_LIMITS[mediaType] || FILE_SIZE_LIMITS.IMAGE
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证文件大小
 */
export function validateFileSize(size: number, mediaType: MediaType): {
  valid: boolean
  error?: string
} {
  const limit = getFileSizeLimit(mediaType)
  
  if (size > limit) {
    return {
      valid: false,
      error: `文件大小超过限制，最大允许 ${formatFileSize(limit)}`
    }
  }
  
  return { valid: true }
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.toLowerCase().split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  return `${timestamp}_${random}.${ext}`
}

/**
 * 清理文件名（移除特殊字符）
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * 媒体处理状态
 */
export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * 媒体处理任务
 */
export interface MediaProcessingTask {
  id: string
  filename: string
  mediaType: MediaType
  status: ProcessingStatus
  progress: number
  startTime: number
  endTime?: number
  error?: string
  result?: any
}

/**
 * 创建处理任务
 */
export function createProcessingTask(
  filename: string,
  mediaType: MediaType
): MediaProcessingTask {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    filename,
    mediaType,
    status: ProcessingStatus.PENDING,
    progress: 0,
    startTime: Date.now(),
  }
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  task: MediaProcessingTask,
  status: ProcessingStatus,
  progress?: number,
  error?: string,
  result?: any
): MediaProcessingTask {
  return {
    ...task,
    status,
    progress: progress ?? task.progress,
    error,
    result,
    endTime: status === ProcessingStatus.COMPLETED || status === ProcessingStatus.FAILED 
      ? Date.now() 
      : task.endTime,
  }
}
