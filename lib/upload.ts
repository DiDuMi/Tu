import { ApiResponse } from '@/types/api'

export interface UploadOptions {
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
  maxFileSize?: number
  allowedTypes?: string[]
}

export interface UploadResult {
  id: number
  uuid: string
  url: string
  type: string
  title?: string
  fileSize?: number
  mimeType?: string
  width?: number
  height?: number
}

/**
 * 上传文件到服务器
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  // 检查文件大小
  const maxFileSize = options?.maxFileSize || 10 * 1024 * 1024 // 默认10MB
  if (file.size > maxFileSize) {
    const error = new Error(`文件大小超过限制（${formatFileSize(maxFileSize)}）`)
    options?.onError?.(error)
    throw error
  }

  // 检查文件类型
  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const fileType = file.type
    const isAllowed = options.allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0]
        return fileType.startsWith(`${mainType}/`)
      }
      return type === fileType
    })

    if (!isAllowed) {
      const error = new Error(`不支持的文件类型：${fileType}`)
      options?.onError?.(error)
      throw error
    }
  }

  // 创建FormData
  const formData = new FormData()
  formData.append('file', file)

  try {
    // 使用fetch API上传文件
    const response = await fetch('/api/v1/media/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = '上传失败'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorMessage
      } catch (e) {
        // 忽略解析错误
      }
      const error = new Error(errorMessage)
      options?.onError?.(error)
      throw error
    }

    const result = await response.json() as ApiResponse<UploadResult>
    return (result as any).data
  } catch (error) {
    const err = error instanceof Error ? error : new Error('上传过程中发生错误')
    options?.onError?.(err)
    throw err
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写）
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 检查文件是否为图片
 * @param file 文件对象
 * @returns 是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 检查文件是否为视频
 * @param file 文件对象
 * @returns 是否为视频
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}
