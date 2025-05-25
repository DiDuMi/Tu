import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'

// 禁用默认的bodyParser，以便我们可以使用formidable解析表单数据
export const config = {
  api: {
    bodyParser: false,
  },
}

// 存储分块的临时目录
const CHUNKS_DIR = path.join(process.cwd(), 'tmp', 'chunks')

/**
 * 媒体上传完成API
 * 合并已上传的分块，并处理媒体文件
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

    try {
      // 解析表单数据
      const form = new IncomingForm({
        multiples: false,
        keepExtensions: true,
      })

      // 解析请求
      const { fields } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err)
          resolve({ fields, files })
        })
      })

      // 获取必要的参数
      const fileId = fields.fileId?.[0]
      const totalChunks = parseInt(fields.totalChunks?.[0] || '1')
      const fileName = fields.fileName?.[0] || `file-${Date.now()}`

      if (!fileId || !totalChunks) {
        return errorResponse(
          res,
          'INVALID_REQUEST',
          '缺少必要参数',
          undefined,
          400
        )
      }

      // 用户专属的分块目录
      const userChunksDir = path.join(CHUNKS_DIR, user.id.toString(), fileId)

      // 检查是否所有分块都已上传
      let uploadedChunks
      try {
        uploadedChunks = await fs.readdir(userChunksDir)
        if (uploadedChunks.length !== totalChunks) {
          return errorResponse(
            res,
            'INCOMPLETE_UPLOAD',
            '上传不完整，缺少部分分块',
            undefined,
            400
          )
        }
      } catch (error) {
        return errorResponse(
          res,
          'CHUNKS_NOT_FOUND',
          '找不到上传的分块',
          error instanceof Error ? error.message : undefined,
          404
        )
      }

      // 合并文件
      try {
        // 准备文件名和路径
        const fileExt = path.extname(fileName)
        const mergedFileName = `${path.basename(fileName, fileExt)}-${Date.now()}${fileExt}`
        
        // 获取媒体存储路径
        const { getMediaStoragePath, getMediaType, processImage, processVideo, processAudio, getMediaUrl } = require('@/lib/media')
        const storagePath = getMediaStoragePath(mergedFileName)
        
        // 确保输出目录存在
        const outputDir = path.dirname(storagePath)
        await fs.mkdir(outputDir, { recursive: true })
        
        // 创建写入流
        const writeStream = fs.createWriteStream(storagePath)
        
        // 按顺序读取并写入所有分块
        for (let i = 0; i < totalChunks; i++) {
          const chunkData = await fs.readFile(path.join(userChunksDir, `${i}`))
          await writeStream.write(chunkData)
        }
        
        await writeStream.close()
        
        // 获取文件MIME类型
        // 由于我们没有原始文件对象，需要从文件扩展名推断MIME类型
        const mimeTypeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.ogg': 'video/ogg',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.m4a': 'audio/x-m4a',
          '.aac': 'audio/aac',
        }
        
        const mimeType = mimeTypeMap[fileExt.toLowerCase()] || 'application/octet-stream'
        
        // 处理媒体文件
        const mediaType = getMediaType(mimeType)
        
        // 处理媒体文件（图片、视频、音频）
        let width, height, duration, thumbnailUrl, processedSize
        
        if (mediaType === 'IMAGE') {
          // 处理图片
          const result = await processImage(storagePath, storagePath, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 80,
            format: 'webp',
          })
          
          if (!result.success) {
            throw new Error(result.error || '图片处理失败')
          }
          
          width = result.width
          height = result.height
          processedSize = result.size
          
          // 生成缩略图
          const thumbPath = storagePath.replace(/\.[^.]+$/, '_thumb.webp')
          const thumbResult = await generateThumbnail(storagePath, thumbPath, {
            width: 300,
            height: 300,
            quality: 70,
            fit: 'cover'
          })
          
          if (thumbResult.success) {
            thumbnailUrl = getMediaUrl(thumbPath)
          }
        } else if (mediaType === 'VIDEO') {
          // 处理视频
          const result = await processVideo(storagePath, storagePath, {
            generateThumbnail: true,
            thumbnailTime: 1,
            maxWidth: 1280,
            maxHeight: 720,
            quality: 23,
            format: 'mp4',
            codec: 'h264',
            fastStart: true,
          })
          
          if (!result.success) {
            throw new Error(result.error || '视频处理失败')
          }
          
          width = result.width
          height = result.height
          duration = result.duration
          processedSize = result.size
          
          if (result.thumbnailPath) {
            thumbnailUrl = getMediaUrl(result.thumbnailPath)
          }
        } else if (mediaType === 'AUDIO') {
          // 处理音频
          const result = await processAudio(storagePath, storagePath, {
            quality: 4,
            format: 'mp3',
            normalize: true,
          })
          
          if (!result.success) {
            throw new Error(result.error || '音频处理失败')
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
          // 直接使用合并后的文件
          const stats = await fs.stat(storagePath)
          processedSize = stats.size
        }
        
        // 获取URL路径
        const url = getMediaUrl(storagePath)
        
        // 从表单获取元数据
        const title = fields.title?.[0] || path.basename(fileName, fileExt)
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
            mimeType,
            width,
            height,
            duration,
            thumbnailUrl,
            storageType: 'LOCAL',
            status: 'ACTIVE',
            userId: user.id,
            categoryId,
            mediaTags: tagIds.length > 0 ? {
              connect: tagIds.map((id: string) => ({ id: parseInt(id) }))
            } : undefined
          },
          include: {
            category: true,
            mediaTags: {
              include: {
                tag: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        })
        
        // 清理临时文件
        await fs.rm(userChunksDir, { recursive: true, force: true })
        
        // 返回成功响应
        return successResponse(res, formatMediaResponse(media))
      } catch (error) {
        console.error('合并文件失败:', error)
        return errorResponse(
          res,
          'MERGE_FAILED',
          '合并文件失败',
          error instanceof Error ? error.message : undefined,
          500
        )
      }
    } catch (error) {
      console.error('完成上传失败:', error)
      return errorResponse(
        res,
        'FINALIZE_UPLOAD_FAILED',
        '完成上传失败',
        error instanceof Error ? error.message : undefined,
        500
      )
    }
  })
)

// 格式化媒体响应
function formatMediaResponse(media: any) {
  if (!media) return null
  
  return {
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
    thumbnailUrl: media.thumbnailUrl || undefined,
    category: media.category ? {
      id: media.category.id,
      name: media.category.name,
      uuid: media.category.uuid
    } : undefined,
    tags: media.mediaTags ? media.mediaTags.map((mediaTag: any) => ({
      id: mediaTag.tag.id,
      name: mediaTag.tag.name,
      uuid: mediaTag.tag.uuid,
      color: mediaTag.tag.color
    })) : [],
    user: media.user ? {
      id: media.user.id,
      name: media.user.name
    } : undefined,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString()
  }
}

// 生成缩略图函数
async function generateThumbnail(inputPath: string, outputPath: string, options: any) {
  const { generateThumbnail } = require('@/lib/media')
  return generateThumbnail(inputPath, outputPath, options)
}
