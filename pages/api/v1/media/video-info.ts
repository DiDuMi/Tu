import { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { successResponse, errorResponse } from '@/lib/api'

const execAsync = promisify(exec)

/**
 * 获取视频文件的详细信息
 * 使用ffprobe分析视频编码格式
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少视频URL参数',
        undefined,
        400
      )
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', url)
    
    // 检查文件是否存在
    try {
      const stats = await fs.stat(filePath)
      if (!stats.isFile()) {
        return errorResponse(
          res,
          'NOT_A_FILE',
          '指定路径不是文件',
          undefined,
          400
        )
      }
    } catch (error) {
      return errorResponse(
        res,
        'FILE_NOT_FOUND',
        '文件不存在',
        undefined,
        404
      )
    }

    const result: any = {
      file: {
        path: filePath,
        url: url,
        exists: true
      },
      ffprobe: null,
      mediainfo: null,
      webCompatibility: {
        issues: [],
        recommendations: []
      }
    }

    // 尝试使用ffprobe获取详细信息
    try {
      const ffprobeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`
      const { stdout } = await execAsync(ffprobeCmd)
      const ffprobeData = JSON.parse(stdout)
      
      result.ffprobe = ffprobeData
      
      // 分析视频流
      const videoStream = ffprobeData.streams?.find((s: any) => s.codec_type === 'video')
      const audioStream = ffprobeData.streams?.find((s: any) => s.codec_type === 'audio')
      
      if (videoStream) {
        // 检查视频编码兼容性
        const videoCodec = videoStream.codec_name
        const profile = videoStream.profile
        const level = videoStream.level
        const pixelFormat = videoStream.pix_fmt
        
        result.webCompatibility.videoCodec = videoCodec
        result.webCompatibility.profile = profile
        result.webCompatibility.level = level
        result.webCompatibility.pixelFormat = pixelFormat
        
        // 检查Web兼容性问题
        if (videoCodec !== 'h264') {
          result.webCompatibility.issues.push(`视频编码 ${videoCodec} 不是H.264，Web兼容性差`)
          result.webCompatibility.recommendations.push('转换为H.264编码')
        }
        
        if (profile && !['Baseline', 'Main', 'High'].includes(profile)) {
          result.webCompatibility.issues.push(`H.264 Profile ${profile} 可能不兼容某些浏览器`)
          result.webCompatibility.recommendations.push('使用Baseline或Main Profile')
        }
        
        if (pixelFormat && !['yuv420p', 'yuvj420p'].includes(pixelFormat)) {
          result.webCompatibility.issues.push(`像素格式 ${pixelFormat} 可能不兼容`)
          result.webCompatibility.recommendations.push('转换为yuv420p格式')
        }
      }
      
      if (audioStream) {
        const audioCodec = audioStream.codec_name
        if (audioCodec && !['aac', 'mp3'].includes(audioCodec)) {
          result.webCompatibility.issues.push(`音频编码 ${audioCodec} 可能不兼容`)
          result.webCompatibility.recommendations.push('转换为AAC或MP3编码')
        }
      }
      
    } catch (ffprobeError) {
      result.ffprobe = {
        error: 'FFprobe不可用或执行失败',
        message: ffprobeError instanceof Error ? ffprobeError.message : '未知错误'
      }
    }

    // 基本文件信息
    try {
      const stats = await fs.stat(filePath)
      result.file.size = stats.size
      result.file.mtime = stats.mtime
      result.file.extension = path.extname(filePath).toLowerCase()
    } catch (error) {
      // 忽略错误
    }

    // 如果没有ffprobe，提供基本建议
    if (!result.ffprobe || result.ffprobe.error) {
      result.webCompatibility.issues.push('无法分析视频编码信息（FFprobe不可用）')
      result.webCompatibility.recommendations.push('安装FFmpeg以获取详细分析')
      result.webCompatibility.recommendations.push('确保视频使用H.264编码和AAC音频')
      result.webCompatibility.recommendations.push('尝试使用在线视频转换工具重新编码')
    }

    return successResponse(res, result)

  } catch (error) {
    console.error('获取视频信息失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '获取视频信息失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default handler
