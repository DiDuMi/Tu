import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { generateVideoThumbnail } from '@/lib/video-optimization'

const thumbnailSchema = z.object({
  src: z.string().url('无效的视频URL'),
  time: z.number().min(0).optional().default(1),
  width: z.number().positive().max(1920).optional().default(320),
  height: z.number().positive().max(1080).optional().default(180),
  quality: z.number().min(1).max(100).optional().default(80),
  format: z.enum(['jpg', 'png', 'webp']).optional().default('jpg')
})

/**
 * 视频缩略图生成API
 * 从视频中提取指定时间点的缩略图
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      `此端点仅支持POST请求，收到${req.method}`,
      405
    )
  }

  try {
    // 验证请求参数
    const validation = thumbnailSchema.safeParse(req.body)
    if (!validation.success) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '无效的请求参数',
        validation.error.errors,
        400
      )
    }

    const { src, time, width, height, quality, format } = validation.data

    // 生成缩略图URL
    const thumbnailUrl = generateVideoThumbnail(src, time, width, height)
    
    // 添加质量和格式参数
    const params = new URLSearchParams()
    params.set('thumbnail', '1')
    params.set('time', time.toString())
    params.set('w', width.toString())
    params.set('h', height.toString())
    params.set('q', quality.toString())
    params.set('format', format)

    const separator = src.includes('?') ? '&' : '?'
    const finalThumbnailUrl = `${src}${separator}${params.toString()}`

    // 生成多个时间点的缩略图（用于预览）
    const previewThumbnails = [0.1, 0.25, 0.5, 0.75, 0.9].map(ratio => {
      const previewTime = time * ratio
      return {
        time: previewTime,
        url: generateVideoThumbnail(src, previewTime, width / 2, height / 2)
      }
    })

    // 生成不同尺寸的缩略图
    const sizeVariants = [
      { name: 'small', width: 160, height: 90 },
      { name: 'medium', width: 320, height: 180 },
      { name: 'large', width: 640, height: 360 },
      { name: 'xlarge', width: 1280, height: 720 }
    ].map(variant => ({
      ...variant,
      url: generateVideoThumbnail(src, time, variant.width, variant.height)
    }))

    return successResponse(res, {
      thumbnail: {
        url: finalThumbnailUrl,
        originalUrl: thumbnailUrl,
        time,
        width,
        height,
        quality,
        format
      },
      variants: {
        sizes: sizeVariants,
        previews: previewThumbnails
      },
      metadata: {
        originalVideo: src,
        generatedAt: new Date().toISOString(),
        aspectRatio: (width / height).toFixed(2)
      }
    })

  } catch (error) {
    console.error('缩略图生成失败:', error)
    return errorResponse(
      res,
      'THUMBNAIL_GENERATION_FAILED',
      '缩略图生成失败',
      error instanceof Error ? error.message : '未知错误',
      500
    )
  }
}

export default withErrorHandler(handler)
