import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { uploadWithDeduplication } from '@/lib/media-upload-dedup'
import { getDeduplicationStats } from '@/lib/file-deduplication'
import { getMediaType } from '@/lib/media'
import { MediaUploadResponse } from '@/types/api'
import { uploadQueue } from '@/lib/upload-queue'

// 禁用Next.js的默认body解析器，让formidable处理
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '500mb',
    externalResolver: true,
  },
}

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

// 最大文件大小 (500MB) - 增加限制以支持更大的视频文件
const MAX_FILE_SIZE = 500 * 1024 * 1024

/**
 * 媒体上传处理函数
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  try {
    // 从中间件获取会话信息
    const session = (req as any).session
    if (!session || !session.user) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        '未授权访问',
        undefined,
        401
      )
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, userGroupId: true },
    })

    if (!user) {
      return errorResponse(
        res,
        'USER_NOT_FOUND',
        '用户不存在',
        undefined,
        404
      )
    }

    // 检查用户组上传限制
    let userGroupMaxFileSize = MAX_FILE_SIZE // 默认使用系统限制

    if (user.userGroupId) {
      const userGroup = await prisma.userGroup.findUnique({
        where: { id: user.userGroupId },
        select: { uploadLimits: true, name: true },
      })

      if (userGroup?.uploadLimits) {
        const limits = JSON.parse(userGroup.uploadLimits)

        console.log('📊 用户组上传限制:', {
          userGroupName: userGroup.name,
          limits,
          systemMaxSize: MAX_FILE_SIZE,
          systemMaxSizeMB: (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
        })

        // 检查用户组文件大小限制
        if (limits.maxFileSize) {
          // 将MB转换为字节
          const groupMaxFileSize = limits.maxFileSize * 1024 * 1024
          userGroupMaxFileSize = Math.min(userGroupMaxFileSize, groupMaxFileSize)

          console.log('📊 用户组文件大小限制:', {
            maxFileSizeMB: limits.maxFileSize,
            maxFileSizeBytes: groupMaxFileSize,
            finalMaxSizeBytes: userGroupMaxFileSize,
            finalMaxSizeMB: (userGroupMaxFileSize / 1024 / 1024).toFixed(0)
          })
        }

        // 检查用户已上传的媒体数量
        if (limits.maxCount) {
          const count = await prisma.media.count({
            where: { userId: user.id, deletedAt: null },
          })

          if (count >= limits.maxCount) {
            return errorResponse(
              res,
              'UPLOAD_LIMIT_EXCEEDED',
              `您已达到最大上传数量限制 (${limits.maxCount})`,
              undefined,
              403
            )
          }
        }
      }
    }

    // 解析上传的文件 - 使用用户组限制
    const form = new IncomingForm()

    // 使用用户组的文件大小限制
    form.maxFileSize = userGroupMaxFileSize
    form.maxTotalFileSize = userGroupMaxFileSize
    form.maxFields = 1000
    form.maxFieldsSize = 20 * 1024 * 1024
    form.keepExtensions = true
    form.allowEmptyFiles = false
    form.minFileSize = 1

    console.log('📊 Formidable配置 (应用用户组限制):', {
      maxFileSize: form.maxFileSize,
      maxTotalFileSize: form.maxTotalFileSize,
      maxFileSizeMB: (form.maxFileSize / 1024 / 1024).toFixed(0),
      maxTotalFileSizeMB: (form.maxTotalFileSize / 1024 / 1024).toFixed(0),
      userGroupMaxSizeMB: (userGroupMaxFileSize / 1024 / 1024).toFixed(0)
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          // 检查是否是文件大小超限错误
          if (err.code === 1009 || err.message.includes('maxTotalFileSize')) {
            const maxSizeMB = userGroupMaxFileSize / 1024 / 1024
            reject(new Error(`文件大小超过限制，最大允许 ${maxSizeMB.toFixed(0)}MB`))
          } else if (err.code === 1008 || err.message.includes('maxFileSize')) {
            const maxSizeMB = userGroupMaxFileSize / 1024 / 1024
            reject(new Error(`单个文件大小超过限制，最大允许 ${maxSizeMB.toFixed(0)}MB`))
          } else {
            reject(err)
          }
        } else {
          resolve([fields, files])
        }
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

    // 检查文件类型 - 智能检测
    const detectedMimeType = file.mimetype || ''
    const fileExtension = path.extname(file.originalFilename || '').toLowerCase()

    // 如果MIME类型是application/octet-stream，尝试根据扩展名判断
    let actualMimeType = detectedMimeType
    if (detectedMimeType === 'application/octet-stream' || !detectedMimeType) {
      switch (fileExtension) {
        case '.mp4':
          actualMimeType = 'video/mp4'
          break
        case '.avi':
          actualMimeType = 'video/avi'
          break
        case '.mov':
          actualMimeType = 'video/quicktime'
          break
        case '.wmv':
          actualMimeType = 'video/x-ms-wmv'
          break
        case '.webm':
          actualMimeType = 'video/webm'
          break
        case '.flv':
          actualMimeType = 'video/x-flv'
          break
        case '.3gp':
          actualMimeType = 'video/3gpp'
          break
        default:
          // 保持原始MIME类型
          break
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

    // 检查文件大小 (使用用户组限制)
    if (file.size > userGroupMaxFileSize) {
      return errorResponse(
        res,
        'FILE_TOO_LARGE',
        `文件大小超过限制，最大允许 ${(userGroupMaxFileSize / 1024 / 1024).toFixed(0)}MB`,
        {
          fileSize: file.size,
          maxSize: userGroupMaxFileSize,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
          maxSizeMB: (userGroupMaxFileSize / 1024 / 1024).toFixed(0),
          systemMaxSizeMB: (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
        },
        400
      )
    }

    // 确定媒体类型
    const mediaType = getMediaType(file.mimetype || '')

    // 生成安全的唯一文件名（忽略原始文件名限制）
    const originalFilename = file.originalFilename || 'file'

    // 创建上传任务
    const taskId = uploadQueue.createTask(user.id, originalFilename, file.size)
    uploadQueue.startUpload(taskId)

    // 记录文件上传（仅用于监控，不影响上传）
    console.log('📁 文件上传:', {
      taskId,
      originalFilename,
      userId: user.id,
      size: file.size,
      mimeType: file.mimetype
    })

    // 获取表单中的元数据
    const title = fields.title?.[0] || file.originalFilename || 'untitled'
    const description = fields.description?.[0] || null
    const categoryId = fields.categoryId?.[0] ? parseInt(fields.categoryId[0]) : undefined
    const tagIds = fields['tags[]']?.map(id => parseInt(id)) || []

    // 使用去重上传功能
    const deduplicationResult = await uploadWithDeduplication(
      file,
      user.id,
      {
        title,
        description,
        categoryId,
        tagIds
      }
    )

    // 检查去重结果
    if (!deduplicationResult.success) {
      uploadQueue.failTask(taskId, deduplicationResult.error || '上传失败')
      return errorResponse(
        res,
        'UPLOAD_FAILED',
        deduplicationResult.error || '文件上传失败',
        undefined,
        500
      )
    }

    const media = deduplicationResult.media

    // 更新上传进度
    if (deduplicationResult.isDuplicate) {
      uploadQueue.updateProgress(taskId, 100, 'completed',
        `文件去重成功！节省存储空间 ${Math.round((deduplicationResult.spaceSaved || 0) / 1024)} KB`)
    } else {
      uploadQueue.updateProgress(taskId, 100, 'completed', '文件上传并处理完成！')
    }

    // 完成上传任务
    uploadQueue.completeTask(taskId, media)

    // 获取去重统计信息（可选，用于日志）
    const stats = await getDeduplicationStats()
    console.log('📊 当前去重统计:', {
      totalUniqueFiles: stats.totalUniqueFiles,
      totalMediaRecords: stats.totalMediaRecords,
      deduplicationRate: stats.deduplicationRate + '%',
      isDuplicate: deduplicationResult.isDuplicate,
      spaceSaved: deduplicationResult.spaceSaved
    })

    // 返回上传结果
    const response: MediaUploadResponse = {
      taskId, // 添加任务ID到响应中
      id: media.id,
      uuid: media.uuid,
      type: media.type,
      url: media.url,
      title: media.title || undefined,
      description: media.description || undefined,
      fileSize: media.fileHash?.fileSize || undefined,
      mimeType: media.fileHash?.mimeType || undefined,
      width: media.fileHash?.width || undefined,
      height: media.fileHash?.height || undefined,
      duration: media.fileHash?.duration || undefined,
      thumbnailUrl: media.thumbnailUrl || undefined,
      category: media.category ? {
        id: media.category.id,
        name: media.category.name,
        uuid: media.category.uuid
      } : undefined,
      tags: media.mediaTags?.map(tag => ({
        id: tag.id,
        name: tag.name,
        uuid: tag.uuid,
        color: tag.color
      })) || [],
      user: media.user ? {
        id: media.user.id,
        name: media.user.name
      } : undefined,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
      // 添加去重信息
      isDuplicate: deduplicationResult.isDuplicate,
      spaceSaved: deduplicationResult.spaceSaved
    }

    const successMessage = deduplicationResult.isDuplicate
      ? `文件去重上传成功！节省存储空间 ${Math.round((deduplicationResult.spaceSaved || 0) / 1024)} KB`
      : '文件上传成功'

    return successResponse(res, response, successMessage)
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
