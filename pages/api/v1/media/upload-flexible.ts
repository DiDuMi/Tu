/**
 * 灵活的媒体上传API
 * 支持中文文件名和更宽松的文件名策略
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getMediaType, processImage, processVideo, processAudio, generateThumbnail, getMediaStoragePath, getMediaUrl } from '@/lib/media'
import { MediaUploadResponse } from '@/types/api'
import { 
  flexibleValidateFilename,
  smartSanitizeFilename,
  FLEXIBLE_POLICY,
  MODERATE_POLICY,
  STRICT_POLICY,
  FilenamePolicy
} from '@/lib/filename-utils-flexible'

// 配置formidable不将文件保存到磁盘
export const config = {
  api: {
    bodyParser: false,
  },
}

// 文件大小限制 (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  // 图片格式
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 视频格式
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv',
  'video/3gpp',
  'video/x-flv',
  'application/octet-stream', // 某些视频文件可能被识别为此类型
  // 音频格式
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
  'audio/aac'
]

/**
 * 根据用户偏好获取文件名策略
 */
function getFilenamePolicy(userPreference?: string): FilenamePolicy {
  switch (userPreference) {
    case 'strict':
      return STRICT_POLICY
    case 'moderate':
      return MODERATE_POLICY
    case 'flexible':
    default:
      return FLEXIBLE_POLICY
  }
}

/**
 * 生成安全的唯一文件名（支持中文）
 */
function generateFlexibleUniqueFilename(originalFilename: string, userId: number, policy: FilenamePolicy): string {
  // 使用智能清理
  const cleanFilename = smartSanitizeFilename(originalFilename, policy)
  
  // 生成时间戳和随机字符串
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  
  // 获取文件扩展名和基础名称
  const ext = path.extname(cleanFilename)
  const baseName = path.basename(cleanFilename, ext)
  
  // 构建最终文件名
  return `${userId}_${timestamp}_${randomStr}_${baseName}${ext}`
}

/**
 * 上传处理函数
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    const user = (req as any).user

    // 获取用户的文件名策略偏好
    const filenamePolicy = getFilenamePolicy(req.headers['x-filename-policy'] as string)

    // 解析上传的文件
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      maxTotalFileSize: MAX_FILE_SIZE,
      maxFields: 1000,
      maxFieldsSize: 20 * 1024 * 1024,
      keepExtensions: true,
      allowEmptyFiles: false,
      minFileSize: 1,
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    // 获取上传的文件
    const file = files.file?.[0]
    if (!file) {
      return errorResponse(
        res,
        'FILE_REQUIRED',
        '未提供文件',
        undefined,
        400
      )
    }

    // 智能MIME类型检测
    const detectedMimeType = file.mimetype || ''
    const fileExtension = path.extname(file.originalFilename || '').toLowerCase()
    
    let actualMimeType = detectedMimeType
    if (detectedMimeType === 'application/octet-stream' || !detectedMimeType) {
      switch (fileExtension) {
        case '.mp4': actualMimeType = 'video/mp4'; break
        case '.avi': actualMimeType = 'video/avi'; break
        case '.mov': actualMimeType = 'video/quicktime'; break
        case '.wmv': actualMimeType = 'video/x-ms-wmv'; break
        case '.webm': actualMimeType = 'video/webm'; break
        case '.flv': actualMimeType = 'video/x-flv'; break
        case '.3gp': actualMimeType = 'video/3gpp'; break
        default: break
      }
    }

    if (!ALLOWED_MIME_TYPES.includes(actualMimeType)) {
      return errorResponse(
        res,
        'INVALID_FILE_TYPE',
        `不支持的文件类型: ${actualMimeType} (${fileExtension})`,
        {
          detectedMimeType,
          fileExtension,
          actualMimeType
        },
        400
      )
    }

    // 更新文件的MIME类型
    file.mimetype = actualMimeType

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        res,
        'FILE_TOO_LARGE',
        `文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        undefined,
        400
      )
    }

    // 确定媒体类型
    const mediaType = getMediaType(file.mimetype || '')

    // 使用灵活的文件名验证
    const originalFilename = file.originalFilename || 'file'
    const validation = flexibleValidateFilename(originalFilename, filenamePolicy)
    
    // 记录文件名分析结果
    console.log('📁 文件名分析:', {
      original: originalFilename,
      validation: validation,
      policy: filenamePolicy,
      userId: user.id
    })

    // 根据验证结果决定处理方式
    let finalFilename: string
    let warningMessage: string | undefined

    if (validation.isValid) {
      // 文件名有效，生成唯一文件名
      finalFilename = generateFlexibleUniqueFilename(originalFilename, user.id, filenamePolicy)
    } else if (validation.canAutoFix && validation.autoFixedName) {
      // 可以自动修复，使用修复后的文件名
      finalFilename = generateFlexibleUniqueFilename(validation.autoFixedName, user.id, filenamePolicy)
      warningMessage = `文件名已自动调整: ${validation.issues.join(', ')}`
    } else {
      // 无法修复，返回错误
      return errorResponse(
        res,
        'INVALID_FILENAME',
        `文件名包含无法处理的字符: ${validation.issues.join(', ')}`,
        {
          issues: validation.issues,
          suggestions: validation.suggestions,
          canAutoFix: validation.canAutoFix,
          autoFixedName: validation.autoFixedName
        },
        400
      )
    }

    const storagePath = getMediaStoragePath(user.id, finalFilename)

    // 确保目录存在
    await fs.mkdir(path.dirname(storagePath), { recursive: true })

    // 处理媒体文件
    let width: number | undefined
    let height: number | undefined
    let duration: number | undefined
    let processedSize: number | undefined
    let thumbnailUrl: string | undefined
    let storageType: string = 'LOCAL'
    let status: string = 'ACTIVE'
    let finalMimeType = file.mimetype

    try {
      if (mediaType === 'IMAGE') {
        // 处理图片
        const result = await processImage(file.filepath, storagePath, {
          maxWidth: 2048,
          maxHeight: 1536,
          quality: 85,
          format: 'webp',
        })

        if (!result.success) {
          return errorResponse(
            res,
            'IMAGE_PROCESSING_FAILED',
            '图片处理失败',
            result.error,
            500
          )
        }

        width = result.width
        height = result.height
        processedSize = result.size

        // 生成缩略图
        const thumbPath = storagePath.replace(/\.[^.]+$/, '_thumb.webp')
        const thumbResult = await generateThumbnail(file.filepath, thumbPath, {
          width: 400,
          height: 400,
          quality: 75,
          fit: 'cover'
        })

        if (thumbResult.success) {
          thumbnailUrl = getMediaUrl(thumbPath)
        }
      } else if (mediaType === 'VIDEO') {
        // 处理视频
        try {
          const result = await processVideo(file.filepath, storagePath, {
            generateThumbnail: true,
            thumbnailTime: 1,
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 25,
            format: 'mp4',
            codec: 'h264',
            fastStart: true,
            preset: 'medium',
          })

          if (result.success) {
            width = result.width
            height = result.height
            duration = result.duration
            processedSize = result.size

            if (result.thumbnailPath) {
              thumbnailUrl = getMediaUrl(result.thumbnailPath)
            }
          } else {
            // 视频处理失败，直接保存原文件
            console.warn('视频处理失败，保存原文件:', result.error)
            await fs.copyFile(file.filepath, storagePath)
            processedSize = file.size
          }
        } catch (error) {
          // FFmpeg不可用，直接保存原文件
          console.warn('视频处理失败，保存原文件:', error instanceof Error ? error.message : '未知错误')
          await fs.copyFile(file.filepath, storagePath)
          processedSize = file.size
          status = 'NEEDS_CONVERSION'
        }
      } else {
        // 直接复制文件
        await fs.copyFile(file.filepath, storagePath)
        processedSize = file.size
      }
    } catch (error) {
      console.error('媒体处理失败:', error)
      return errorResponse(
        res,
        'MEDIA_PROCESSING_FAILED',
        '媒体处理失败',
        error instanceof Error ? error.message : undefined,
        500
      )
    }

    // 清理临时文件
    try {
      await fs.unlink(file.filepath)
    } catch (error) {
      console.warn('清理临时文件失败:', error)
    }

    // 获取URL路径
    const url = getMediaUrl(storagePath)

    // 获取表单中的元数据
    const title = fields.title?.[0] || originalFilename
    const description = fields.description?.[0] || null
    const categoryId = fields.categoryId?.[0] ? parseInt(fields.categoryId[0]) : null
    const tagIds = fields['tags[]'] || []

    // 创建媒体记录
    const media = await prisma.media.create({
      data: {
        type: mediaType,
        url,
        title,
        description,
        fileSize: processedSize,
        mimeType: finalMimeType,
        width,
        height,
        duration,
        storageType,
        status,
        userId: user.id,
        categoryId,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // 返回上传结果
    const response: MediaUploadResponse & { warning?: string } = {
      id: media.id,
      uuid: media.uuid,
      type: media.type,
      url: media.url,
      title: media.title || undefined,
      description: media.description || undefined,
      fileSize: media.fileSize || undefined,
      mimeType: media.mimeType || undefined,
      width: media.width || undefined,
      height: media.height || undefined,
      duration: media.duration || undefined,
      thumbnailUrl,
      category: media.category ? {
        id: media.category.id,
        name: media.category.name,
        uuid: media.category.uuid
      } : undefined,
      tags: [],
      user: media.user ? {
        id: media.user.id,
        name: media.user.name
      } : undefined,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
      warning: warningMessage
    }

    return successResponse(res, response, '文件上传成功')
  } catch (error) {
    console.error('文件上传失败:', error)
    return errorResponse(
      res,
      'UPLOAD_FAILED',
      '文件上传失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))
