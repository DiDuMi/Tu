import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import {
  processImage,
  processVideo,
  processAudio,
  getMediaStoragePath,
  getMediaUrl,
  formatMediaInfo
} from '@/lib/media'

// 请求验证模式
const processImageSchema = z.object({
  mediaId: z.number().or(z.string().transform(val => parseInt(val, 10))),
  operation: z.enum(['resize', 'crop', 'rotate', 'convert', 'optimize']),
  width: z.number().optional(),
  height: z.number().optional(),
  quality: z.number().min(1).max(100).optional(),
  format: z.enum(['webp', 'jpeg', 'png', 'avif']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  rotate: z.number().min(-360).max(360).optional(),
  grayscale: z.boolean().optional(),
  blur: z.number().min(0.3).max(1000).optional(),
  sharpen: z.boolean().optional(),
  left: z.number().optional(),
  top: z.number().optional(),
  createVersion: z.boolean().default(true),
  versionNote: z.string().optional(),
})

const processVideoSchema = z.object({
  mediaId: z.number().or(z.string().transform(val => parseInt(val, 10))),
  operation: z.enum(['resize', 'convert', 'trim', 'optimize']),
  width: z.number().optional(),
  height: z.number().optional(),
  quality: z.number().min(1).max(51).optional(), // CRF值，越低质量越高
  format: z.enum(['mp4', 'webm', 'gif']).optional(),
  codec: z.enum(['h264', 'h265', 'vp9']).optional(),
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  createVersion: z.boolean().default(true),
  versionNote: z.string().optional(),
})

const processAudioSchema = z.object({
  mediaId: z.number().or(z.string().transform(val => parseInt(val, 10))),
  operation: z.enum(['convert', 'trim', 'normalize']),
  quality: z.number().min(0).max(9).optional(), // 音频质量，值越小质量越高
  format: z.enum(['mp3', 'aac', 'ogg', 'wav']).optional(),
  bitrate: z.string().optional(),
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  normalize: z.boolean().optional(),
  createVersion: z.boolean().default(true),
  versionNote: z.string().optional(),
})

/**
 * 媒体处理API
 * 支持图片裁剪、调整大小、格式转换等操作
 */
export default withErrorHandler(
  withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
    // 只允许POST请求
    if (req.method !== 'POST') {
      return errorResponse(
        res,
        'METHOD_NOT_ALLOWED',
        '只允许POST请求',
        undefined,
        405
      )
    }

    // 解析请求体
    const body = req.body

    // 获取媒体ID
    const mediaId = body.mediaId
    if (!mediaId) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少媒体ID',
        undefined,
        400
      )
    }

    // 查询媒体
    const media = await prisma.media.findUnique({
      where: { id: Number(mediaId) },
    })

    if (!media) {
      return errorResponse(
        res,
        'MEDIA_NOT_FOUND',
        '媒体不存在',
        undefined,
        404
      )
    }

    // 检查权限
    if (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && media.userId !== user.id) {
      return errorResponse(
        res,
        'FORBIDDEN',
        '没有权限处理此媒体',
        undefined,
        403
      )
    }

    // 根据媒体类型选择处理方式
    try {
      let result
      let newMediaPath
      let versionNumber = 1

      // 获取最新版本号
      const latestVersion = await prisma.mediaVersion.findFirst({
        where: { mediaId: media.id },
        orderBy: { versionNumber: 'desc' },
      })

      if (latestVersion) {
        versionNumber = latestVersion.versionNumber + 1
      }

      // 生成新的文件名和路径
      const originalExt = path.extname(media.url)
      const filename = `${path.basename(media.url, originalExt)}_v${versionNumber}${originalExt}`
      const storagePath = getMediaStoragePath(user.id, filename)

      // 确保原始文件存在
      const originalPath = path.join(process.cwd(), 'public', new URL(media.url).pathname)
      try {
        await fs.access(originalPath)
      } catch (error) {
        return errorResponse(
          res,
          'FILE_NOT_FOUND',
          '原始文件不存在',
          undefined,
          404
        )
      }

      // 根据媒体类型处理
      switch (media.type) {
        case 'IMAGE':
          // 验证请求参数
          const imageValidation = processImageSchema.safeParse(body)
          if (!imageValidation.success) {
            return errorResponse(
              res,
              'INVALID_REQUEST',
              '无效的请求参数',
              imageValidation.error.errors,
              400
            )
          }

          const imageParams = imageValidation.data

          // 处理图片
          result = await processImage(originalPath, storagePath, {
            maxWidth: imageParams.width,
            maxHeight: imageParams.height,
            quality: imageParams.quality,
            format: imageParams.format,
            fit: imageParams.fit,
            rotate: imageParams.rotate,
            grayscale: imageParams.grayscale,
            blur: imageParams.blur,
            sharpen: imageParams.sharpen,
          })
          break

        case 'VIDEO':
          // 验证请求参数
          const videoValidation = processVideoSchema.safeParse(body)
          if (!videoValidation.success) {
            return errorResponse(
              res,
              'INVALID_REQUEST',
              '无效的请求参数',
              videoValidation.error.errors,
              400
            )
          }

          const videoParams = videoValidation.data

          // 处理视频
          result = await processVideo(originalPath, storagePath, {
            maxWidth: videoParams.width,
            maxHeight: videoParams.height,
            quality: videoParams.quality,
            format: videoParams.format,
            codec: videoParams.codec,
            startTime: videoParams.startTime,
            duration: videoParams.duration,
            generateThumbnail: true,
          })
          break

        case 'AUDIO':
          // 验证请求参数
          const audioValidation = processAudioSchema.safeParse(body)
          if (!audioValidation.success) {
            return errorResponse(
              res,
              'INVALID_REQUEST',
              '无效的请求参数',
              audioValidation.error.errors,
              400
            )
          }

          const audioParams = audioValidation.data

          // 处理音频
          result = await processAudio(originalPath, storagePath, {
            quality: audioParams.quality,
            format: audioParams.format,
            bitrate: audioParams.bitrate,
            startTime: audioParams.startTime,
            duration: audioParams.duration,
            normalize: audioParams.normalize,
          })
          break

        default:
          return errorResponse(
            res,
            'UNSUPPORTED_MEDIA_TYPE',
            '不支持的媒体类型',
            undefined,
            400
          )
      }

      if (!result.success) {
        return errorResponse(
          res,
          'PROCESSING_FAILED',
          '媒体处理失败',
          result.error,
          500
        )
      }

      // 获取新媒体URL
      const url = getMediaUrl(storagePath)

      // 创建版本记录
      const createVersion = body.createVersion !== false
      let version

      if (createVersion) {
        version = await prisma.mediaVersion.create({
          data: {
            uuid: uuidv4(),
            mediaId: media.id,
            versionNumber,
            url,
            width: 'width' in result ? result.width : null,
            height: 'height' in result ? result.height : null,
            duration: 'duration' in result ? result.duration : null,
            fileSize: result.size,
            thumbnailUrl: 'thumbnailPath' in result && result.thumbnailPath ? getMediaUrl(result.thumbnailPath) : null,
            changeNote: body.versionNote || `处理操作: ${body.operation}`,
            userId: user.id,
          },
        })
      }

      // 返回处理结果
      return successResponse(res, {
        success: true,
        media: formatMediaInfo(media),
        version: version || null,
        operation: body.operation,
        result: {
          url,
          width: 'width' in result ? result.width : null,
          height: 'height' in result ? result.height : null,
          duration: 'duration' in result ? result.duration : null,
          size: result.size,
          thumbnailUrl: 'thumbnailPath' in result && result.thumbnailPath ? getMediaUrl(result.thumbnailPath) : null,
        },
      })
    } catch (error) {
      console.error('媒体处理失败:', error)
      return errorResponse(
        res,
        'PROCESSING_ERROR',
        '媒体处理失败',
        error instanceof Error ? error.message : undefined,
        500
      )
    }
  })
)
