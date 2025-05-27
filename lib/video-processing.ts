import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

export const execPromise = promisify(exec)

export const FFMPEG_PATHS = {
  ffmpeg: 'C:\\ffmpeg\\bin\\ffmpeg.exe',
  ffprobe: 'C:\\ffmpeg\\bin\\ffprobe.exe'
}

/**
 * 视频处理选项
 */
export interface VideoProcessOptions {
  generateThumbnail?: boolean
  thumbnailTime?: number
  thumbnailCount?: number
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'mp4' | 'webm' | 'gif'
  codec?: 'h264' | 'h265' | 'vp9'
  audioCodec?: 'aac' | 'opus' | 'mp3'
  audioBitrate?: string
  fps?: number
  startTime?: number
  duration?: number
  fastStart?: boolean
  metadata?: boolean
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
}

/**
 * 视频处理结果
 */
export interface VideoProcessResult {
  success: boolean
  path?: string
  thumbnailPath?: string
  thumbnailPaths?: string[]
  width?: number
  height?: number
  duration?: number
  size?: number
  originalSize?: number
  format?: string
  codec?: string
  fps?: number
  bitrate?: number
  metadata?: any
  error?: string
}

/**
 * 获取视频信息
 */
export async function getVideoInfo(videoPath: string): Promise<{
  width?: number
  height?: number
  duration?: number
  format?: string
  codec?: string
  fps?: number
  bitrate?: number
  audioCodec?: string
  audioBitrate?: string
} | null> {
  try {
    const { stdout } = await execPromise(
      `"${FFMPEG_PATHS.ffprobe}" -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name,r_frame_rate,bit_rate:format=format_name -show_entries stream_tags=rotate -of json "${videoPath}"`
    )

    const info = JSON.parse(stdout)
    const videoStream = info.streams?.[0]

    if (!videoStream) {
      return null
    }

    let fps: number | undefined
    if (videoStream.r_frame_rate) {
      const [numerator, denominator] = videoStream.r_frame_rate.split('/')
      fps = Math.round((parseInt(numerator) / parseInt(denominator)) * 100) / 100
    }

    const { stdout: audioStdout } = await execPromise(
      `"${FFMPEG_PATHS.ffprobe}" -v error -select_streams a:0 -show_entries stream=codec_name,bit_rate -of json "${videoPath}"`
    ).catch(() => ({ stdout: '{"streams":[]}' }))

    const audioInfo = JSON.parse(audioStdout)
    const audioStream = audioInfo.streams?.[0]

    return {
      width: videoStream.width,
      height: videoStream.height,
      duration: parseFloat(videoStream.duration || info.format?.duration || '0'),
      format: info.format?.format_name,
      codec: videoStream.codec_name,
      fps,
      bitrate: parseInt(videoStream.bit_rate || info.format?.bit_rate || '0'),
      audioCodec: audioStream?.codec_name,
      audioBitrate: audioStream?.bit_rate ? `${Math.round(parseInt(audioStream.bit_rate) / 1000)}k` : undefined
    }
  } catch (error) {
    console.error('获取视频信息失败:', error)
    return null
  }
}

/**
 * 处理视频
 */
export async function processVideo(
  inputPath: string,
  outputPath: string,
  options: VideoProcessOptions = {}
): Promise<VideoProcessResult> {
  try {
    if (!inputPath || !outputPath) {
      throw new Error('输入路径和输出路径不能为空')
    }

    await fs.access(inputPath)
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

    const {
      generateThumbnail = true,
      thumbnailTime = 0,
      thumbnailCount = 1,
      maxWidth = 1280,
      maxHeight = 720,
      quality = 23,
      format = 'mp4',
      codec = 'h264',
      audioCodec = 'aac',
      audioBitrate = '128k',
      fps,
      startTime,
      duration,
      fastStart = true,
      metadata = false,
      preset = 'medium',
    } = options

    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    const videoInfo = await getVideoInfo(inputPath)
    if (!videoInfo) {
      throw new Error('无法获取视频信息')
    }

    let ffmpegCmd = `"${FFMPEG_PATHS.ffmpeg}" -i "${inputPath}" `

    if (startTime !== undefined) {
      ffmpegCmd += `-ss ${startTime} `
    }

    if (duration !== undefined) {
      ffmpegCmd += `-t ${duration} `
    }

    // 视频编码参数
    ffmpegCmd += `-c:v ${codec} -preset ${preset} -crf ${quality} `

    // 分辨率限制
    if (videoInfo.width && videoInfo.height) {
      const scale = Math.min(maxWidth / videoInfo.width, maxHeight / videoInfo.height, 1)
      if (scale < 1) {
        const newWidth = Math.floor(videoInfo.width * scale / 2) * 2
        const newHeight = Math.floor(videoInfo.height * scale / 2) * 2
        ffmpegCmd += `-vf "scale=${newWidth}:${newHeight}" `
      }
    }

    // 音频编码参数
    ffmpegCmd += `-c:a ${audioCodec} -b:a ${audioBitrate} `

    // 帧率设置
    if (fps) {
      ffmpegCmd += `-r ${fps} `
    }

    // 快速启动优化
    if (fastStart && format === 'mp4') {
      ffmpegCmd += `-movflags +faststart `
    }

    // 元数据处理
    if (!metadata) {
      ffmpegCmd += `-map_metadata -1 `
    }

    ffmpegCmd += `-y "${outputPath}"`

    console.log('执行FFmpeg命令:', ffmpegCmd)
    await execPromise(ffmpegCmd)

    const stats = await fs.stat(outputPath)
    const processedVideoInfo = await getVideoInfo(outputPath)

    let thumbnailPath: string | undefined
    let thumbnailPaths: string[] | undefined

    if (generateThumbnail) {
      const thumbnailDir = path.dirname(outputPath)
      const baseName = path.basename(outputPath, path.extname(outputPath))
      
      if (thumbnailCount === 1) {
        thumbnailPath = path.join(thumbnailDir, `${baseName}_thumb.jpg`)
        const thumbCmd = `"${FFMPEG_PATHS.ffmpeg}" -i "${outputPath}" -ss ${thumbnailTime} -vframes 1 -y "${thumbnailPath}"`
        await execPromise(thumbCmd)
      } else {
        thumbnailPaths = []
        for (let i = 0; i < thumbnailCount; i++) {
          const time = (videoInfo.duration || 0) * (i + 1) / (thumbnailCount + 1)
          const thumbPath = path.join(thumbnailDir, `${baseName}_thumb_${i + 1}.jpg`)
          const thumbCmd = `"${FFMPEG_PATHS.ffmpeg}" -i "${outputPath}" -ss ${time} -vframes 1 -y "${thumbPath}"`
          await execPromise(thumbCmd)
          thumbnailPaths.push(thumbPath)
        }
      }
    }

    return {
      success: true,
      path: outputPath,
      thumbnailPath,
      thumbnailPaths,
      width: processedVideoInfo?.width,
      height: processedVideoInfo?.height,
      duration: processedVideoInfo?.duration,
      size: stats.size,
      originalSize,
      format: processedVideoInfo?.format,
      codec: processedVideoInfo?.codec,
      fps: processedVideoInfo?.fps,
      bitrate: processedVideoInfo?.bitrate,
      metadata: metadata ? processedVideoInfo : undefined,
    }
  } catch (error) {
    console.error('视频处理失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '视频处理失败',
    }
  }
}
