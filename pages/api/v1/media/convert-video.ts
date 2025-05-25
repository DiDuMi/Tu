import { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { successResponse, errorResponse } from '@/lib/api'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

/**
 * 转换视频为Web兼容格式
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
    const { mediaId, options = {} } = req.body

    if (!mediaId) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少媒体ID',
        undefined,
        400
      )
    }

    // 查找媒体记录
    const media = await prisma.media.findUnique({
      where: { id: parseInt(mediaId) }
    })

    if (!media) {
      return errorResponse(
        res,
        'MEDIA_NOT_FOUND',
        '媒体文件不存在',
        undefined,
        404
      )
    }

    if (media.type !== 'VIDEO') {
      return errorResponse(
        res,
        'INVALID_MEDIA_TYPE',
        '只能转换视频文件',
        undefined,
        400
      )
    }

    const currentPath = path.join(process.cwd(), 'public', media.url)

    // 检查文件是否存在
    try {
      await fs.access(currentPath)
    } catch (error) {
      return errorResponse(
        res,
        'FILE_NOT_FOUND',
        '物理文件不存在',
        undefined,
        404
      )
    }

    // 生成转换后的文件路径
    const ext = path.extname(currentPath)
    const baseName = path.basename(currentPath, ext)
    const dir = path.dirname(currentPath)
    const convertedPath = path.join(dir, `${baseName}_converted.mp4`)
    const convertedUrl = media.url.replace(path.basename(media.url), `${baseName}_converted.mp4`)

    // 检查FFmpeg是否可用
    try {
      await execAsync('ffmpeg -version')
    } catch (error) {
      return errorResponse(
        res,
        'FFMPEG_NOT_AVAILABLE',
        'FFmpeg未安装或不可用',
        '请安装FFmpeg以使用视频转换功能',
        500
      )
    }

    // 构建FFmpeg命令 - 使用Web兼容的参数
    const {
      profile = 'baseline',
      level = '3.0',
      crf = '23',
      maxrate = '1M',
      bufsize = '2M',
      preset = 'medium',
      audioCodec = 'aac',
      audioBitrate = '128k',
      audioSampleRate = '44100'
    } = options

    const ffmpegCmd = [
      'ffmpeg',
      '-i', `"${currentPath}"`,
      '-c:v', 'libx264',
      '-profile:v', profile,
      '-level', level,
      '-pix_fmt', 'yuv420p',
      '-crf', crf,
      '-maxrate', maxrate,
      '-bufsize', bufsize,
      '-preset', preset,
      '-c:a', audioCodec,
      '-b:a', audioBitrate,
      '-ar', audioSampleRate,
      '-movflags', '+faststart', // 优化网络播放
      '-y', // 覆盖输出文件
      `"${convertedPath}"`
    ].join(' ')

    console.log('执行FFmpeg命令:', ffmpegCmd)

    // 执行转换
    try {
      const { stdout, stderr } = await execAsync(ffmpegCmd, {
        timeout: 300000 // 5分钟超时
      })

      console.log('FFmpeg输出:', stdout)
      if (stderr) {
        console.log('FFmpeg错误输出:', stderr)
      }
    } catch (error) {
      console.error('FFmpeg执行失败:', error)
      return errorResponse(
        res,
        'CONVERSION_FAILED',
        '视频转换失败',
        error instanceof Error ? error.message : '未知错误',
        500
      )
    }

    // 检查转换后的文件是否存在
    try {
      const stats = await fs.stat(convertedPath)

      // 获取转换后的视频信息
      let videoInfo: any = {}
      try {
        const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${convertedPath}"`
        const { stdout } = await execAsync(probeCmd)
        const probeData = JSON.parse(stdout)

        const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video')
        if (videoStream) {
          videoInfo = {
            width: videoStream.width,
            height: videoStream.height,
            duration: parseFloat(probeData.format?.duration || '0'),
            codec: videoStream.codec_name,
            profile: videoStream.profile,
            pixelFormat: videoStream.pix_fmt
          }
        }
      } catch (probeError) {
        console.warn('获取视频信息失败:', probeError)
      }

      // 更新数据库记录
      await prisma.media.update({
        where: { id: media.id },
        data: {
          url: convertedUrl,
          size: stats.size,
          width: videoInfo.width,
          height: videoInfo.height,
          duration: videoInfo.duration,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })

      // 删除原文件（可选）
      if (options.deleteOriginal) {
        try {
          await fs.unlink(currentPath)
        } catch (error) {
          console.warn('删除原文件失败:', error)
        }
      }

      return successResponse(res, {
        mediaId: media.id,
        originalUrl: media.url,
        convertedUrl: convertedUrl,
        originalSize: media.fileSize || 0,
        convertedSize: stats.size,
        compressionRatio: media.fileSize ? ((media.fileSize - stats.size) / media.fileSize * 100).toFixed(2) + '%' : '0%',
        videoInfo: videoInfo,
        message: '视频转换成功'
      })

    } catch (error) {
      return errorResponse(
        res,
        'CONVERSION_VERIFICATION_FAILED',
        '转换后文件验证失败',
        error instanceof Error ? error.message : '未知错误',
        500
      )
    }

  } catch (error) {
    console.error('视频转换失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '视频转换失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
  },
}
