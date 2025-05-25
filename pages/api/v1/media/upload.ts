import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'

import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getMediaType, processImage, processVideo, processAudio, generateThumbnail, getMediaStoragePath, getMediaUrl } from '@/lib/media'
import { MediaUploadResponse } from '@/types/api'
import {
  flexibleValidateFilename,
  smartSanitizeFilename,
  FLEXIBLE_POLICY
} from '@/lib/filename-utils-flexible'

// 配置formidable不将文件保存到磁盘
export const config = {
  api: {
    bodyParser: false,
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

// 最大文件大小 (100MB) - 增加限制以支持更大的视频文件
const MAX_FILE_SIZE = 100 * 1024 * 1024

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
    if (user.userGroupId) {
      const userGroup = await prisma.userGroup.findUnique({
        where: { id: user.userGroupId },
        select: { uploadLimits: true },
      })

      if (userGroup?.uploadLimits) {
        const limits = JSON.parse(userGroup.uploadLimits)

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

    // 解析上传的文件
    const form = new IncomingForm({
      maxFileSize: MAX_FILE_SIZE,
      maxTotalFileSize: MAX_FILE_SIZE, // 添加总文件大小限制
      maxFields: 1000, // 增加字段数量限制
      maxFieldsSize: 20 * 1024 * 1024, // 增加字段大小限制
      keepExtensions: true,
      allowEmptyFiles: false,
      minFileSize: 1, // 最小文件大小
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

    // 生成安全的唯一文件名（忽略原始文件名限制）
    const originalFilename = file.originalFilename || 'file'

    // 记录文件上传（仅用于监控，不影响上传）
    console.log('📁 文件上传:', {
      originalFilename,
      userId: user.id,
      size: file.size,
      mimeType: file.mimetype
    })

    // 直接生成安全的唯一文件名，不进行文件名验证
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const safeFileExtension = path.extname(originalFilename).toLowerCase() || '.bin'

    // 生成完全安全的文件名：用户ID_时间戳_随机字符串.扩展名
    const safeFilename = `${user.id}_${timestamp}_${randomStr}${safeFileExtension}`
    const storagePath = getMediaStoragePath(user.id, safeFilename)

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
        // 处理图片 - 智能压缩
        const result = await processImage(file.filepath, storagePath, {
          maxWidth: 2048,  // 提高最大宽度，保持高质量
          maxHeight: 1536, // 提高最大高度，保持高质量
          quality: 85,     // 提高质量，减少压缩损失
          format: 'webp',  // 使用WebP格式，压缩率更好
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
          width: 400,  // 提高缩略图尺寸
          height: 400, // 提高缩略图尺寸
          quality: 75, // 提高缩略图质量
          fit: 'cover'
        })

        if (thumbResult.success) {
          thumbnailUrl = getMediaUrl(thumbPath)
        }
      } else if (mediaType === 'VIDEO') {
        // 尝试处理视频 - 如果FFmpeg不可用则跳过处理
        try {
          const result = await processVideo(file.filepath, storagePath, {
            generateThumbnail: true,
            thumbnailTime: 1,    // 从视频1秒处截取缩略图
            maxWidth: 1920,      // 提高最大宽度，支持高清视频
            maxHeight: 1080,     // 提高最大高度，支持高清视频
            quality: 25,         // 稍微提高质量，减少压缩损失
            format: 'mp4',
            codec: 'h264',
            fastStart: true,     // 优化网络播放
            preset: 'medium',    // 使用中等预设，平衡质量和文件大小
          })

          if (result.success) {
            width = result.width
            height = result.height
            duration = result.duration
            processedSize = result.size

            // 如果生成了缩略图，保存缩略图URL
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
          // FFmpeg不可用或其他错误，直接保存原文件
          console.warn('视频处理失败，保存原文件:', error instanceof Error ? error.message : '未知错误')
          await fs.copyFile(file.filepath, storagePath)
          processedSize = file.size

          // 确保MIME类型正确设置
          if (!finalMimeType || finalMimeType === 'application/octet-stream') {
            // 根据文件扩展名设置MIME类型
            const ext = path.extname(file.originalFilename || '').toLowerCase()
            switch (ext) {
              case '.mp4':
                finalMimeType = 'video/mp4'
                break
              case '.webm':
                finalMimeType = 'video/webm'
                break
              case '.avi':
                finalMimeType = 'video/avi'
                break
              case '.mov':
                finalMimeType = 'video/quicktime'
                break
              case '.wmv':
                finalMimeType = 'video/x-ms-wmv'
                break
              default:
                finalMimeType = 'video/mp4' // 默认为mp4
            }
          }

          // 添加警告信息到状态中，提示用户可能需要转换视频
          status = 'NEEDS_CONVERSION'
          console.log(`视频文件 ${file.originalFilename} 未经过FFmpeg处理，可能存在兼容性问题`)
        }
      } else if (mediaType === 'AUDIO') {
        // 处理音频
        const result = await processAudio(file.filepath, storagePath, {
          quality: 4, // 较好的质量
          format: 'mp3',
          normalize: true, // 标准化音量
        })

        if (!result.success) {
          return errorResponse(
            res,
            'AUDIO_PROCESSING_FAILED',
            '音频处理失败',
            result.error,
            500
          )
        }

        duration = result.duration
        processedSize = result.size

        // 为音频生成一个默认的缩略图
        const defaultAudioThumbPath = path.join('public', 'images', 'audio-thumbnail.webp')
        if (await fs.stat(defaultAudioThumbPath).catch(() => null)) {
          const thumbPath = storagePath.replace(/\.[^.]+$/, '_thumb.webp')
          await fs.copyFile(defaultAudioThumbPath, thumbPath)
          thumbnailUrl = getMediaUrl(thumbPath)
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
    const title = fields.title?.[0] || file.originalFilename || safeFilename
    const description = fields.description?.[0] || null
    const categoryId = fields.categoryId?.[0] ? parseInt(fields.categoryId[0]) : null
    const tagIds = fields['tags[]'] || []

    // 验证分类ID
    if (categoryId) {
      const category = await prisma.mediaCategory.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return errorResponse(
          res,
          'INVALID_CATEGORY',
          '分类不存在',
          undefined,
          400
        )
      }
    }

    // 验证标签ID
    const tagConnections = []
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        const tag = await prisma.mediaTag.findUnique({
          where: { id: parseInt(tagId) }
        })

        if (!tag) {
          return errorResponse(
            res,
            'INVALID_TAG',
            `标签ID ${tagId} 不存在`,
            undefined,
            400
          )
        }

        tagConnections.push({ id: parseInt(tagId) })
      }
    }

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
        mediaTags: tagIds.length > 0 ? {
          connect: tagConnections
        } : undefined,
        // 创建初始版本记录
        versions: thumbnailUrl ? {
          create: {
            url,
            versionNumber: 1,
            fileSize: processedSize,
            width,
            height,
            duration,
            thumbnailUrl,
            changeNote: '初始版本',
            userId: user.id
          }
        } : undefined
      },
      include: {
        category: true,
        mediaTags: true,
        versions: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // 返回上传结果
    const latestVersion = media.versions?.[0] // 获取最新版本
    const response: MediaUploadResponse = {
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
      thumbnailUrl: latestVersion?.thumbnailUrl || undefined,
      category: media.category ? {
        id: media.category.id,
        name: media.category.name,
        uuid: media.category.uuid
      } : undefined,
      tags: media.mediaTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        uuid: tag.uuid,
        color: tag.color
      })),
      user: media.user ? {
        id: media.user.id,
        name: media.user.name
      } : undefined,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString()
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
