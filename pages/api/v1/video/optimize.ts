import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { generateOptimizedVideoUrl, getOptimalVideoQuality, detectVideoFormatSupport } from '@/lib/video-optimization'

const optimizeVideoSchema = z.object({
  src: z.string().url('无效的视频URL'),
  quality: z.enum(['low', 'medium', 'high', 'auto']).optional().default('auto'),
  format: z.enum(['mp4', 'webm', 'av1', 'auto']).optional().default('auto'),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  codec: z.enum(['h264', 'h265', 'vp9', 'av1']).optional(),
  audioCodec: z.enum(['aac', 'opus', 'mp3']).optional(),
  bitrate: z.string().optional(),
  audioBitrate: z.string().optional(),
  fps: z.number().positive().max(120).optional(),
  fastStart: z.boolean().optional().default(true),
  generateThumbnail: z.boolean().optional().default(false),
  thumbnailTime: z.number().min(0).optional().default(1)
})

/**
 * 视频优化API
 * 根据客户端条件生成最优的视频URL和参数
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
    const validation = optimizeVideoSchema.safeParse(req.body)
    if (!validation.success) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '无效的请求参数',
        validation.error.errors,
        400
      )
    }

    const params = validation.data

    // 获取客户端信息
    const userAgent = req.headers['user-agent'] || ''
    const acceptHeader = req.headers['accept'] || ''
    
    // 检测客户端支持的格式（基于User-Agent简单判断）
    const clientSupport = {
      webm: userAgent.includes('Chrome') || userAgent.includes('Firefox'),
      av1: userAgent.includes('Chrome/') && parseInt(userAgent.split('Chrome/')[1]) >= 90,
      h265: userAgent.includes('Safari') && !userAgent.includes('Chrome'),
      hdr: false // 简化处理
    }

    // 生成优化的视频URL
    const optimizedUrl = generateOptimizedVideoUrl(params.src, {
      quality: params.quality,
      format: params.format,
      width: params.width,
      height: params.height,
      codec: params.codec,
      audioCodec: params.audioCodec,
      bitrate: params.bitrate,
      audioBitrate: params.audioBitrate,
      fps: params.fps,
      fastStart: params.fastStart,
      generateThumbnail: params.generateThumbnail,
      thumbnailTime: params.thumbnailTime
    })

    // 获取推荐的质量设置
    const recommendedQuality = getOptimalVideoQuality()

    // 生成多个质量版本的URL
    const qualityVariants = ['low', 'medium', 'high'].map(quality => ({
      quality,
      url: generateOptimizedVideoUrl(params.src, {
        ...params,
        quality: quality as any
      }),
      recommended: quality === recommendedQuality
    }))

    // 生成多个格式版本的URL
    const formatVariants = ['mp4', 'webm'].map(format => ({
      format,
      url: generateOptimizedVideoUrl(params.src, {
        ...params,
        format: format as any
      }),
      supported: format === 'mp4' || clientSupport.webm,
      mimeType: format === 'mp4' ? 'video/mp4' : 'video/webm'
    }))

    // 生成缩略图URL（如果需要）
    let thumbnailUrl: string | undefined
    if (params.generateThumbnail) {
      const thumbnailParams = new URLSearchParams()
      thumbnailParams.set('thumbnail', '1')
      thumbnailParams.set('time', params.thumbnailTime.toString())
      thumbnailParams.set('w', (params.width || 320).toString())
      thumbnailParams.set('h', (params.height || 180).toString())
      
      const separator = params.src.includes('?') ? '&' : '?'
      thumbnailUrl = `${params.src}${separator}${thumbnailParams.toString()}`
    }

    // 计算预期的优化效果
    const optimizationEstimate = {
      sizeReduction: params.quality === 'low' ? '40-60%' : 
                    params.quality === 'medium' ? '20-40%' : 
                    params.quality === 'high' ? '10-20%' : '20-40%',
      loadTimeImprovement: params.quality === 'low' ? '50-70%' : 
                          params.quality === 'medium' ? '30-50%' : 
                          params.quality === 'high' ? '15-30%' : '30-50%',
      compatibilityScore: clientSupport.webm ? 95 : 85
    }

    return successResponse(res, {
      original: {
        url: params.src,
        quality: params.quality,
        format: params.format
      },
      optimized: {
        url: optimizedUrl,
        thumbnailUrl,
        recommendedQuality,
        clientSupport,
        optimizationEstimate
      },
      variants: {
        quality: qualityVariants,
        format: formatVariants
      },
      metadata: {
        userAgent,
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    })

  } catch (error) {
    console.error('视频优化失败:', error)
    return errorResponse(
      res,
      'OPTIMIZATION_FAILED',
      '视频优化失败',
      error instanceof Error ? error.message : '未知错误',
      500
    )
  }
}

export default withErrorHandler(handler)
