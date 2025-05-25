import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { formatFileSize } from './upload'
import { MediaResponse } from '@/types/api'

// 将exec转换为Promise版本
const execPromise = promisify(exec)

/**
 * 媒体类型
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

/**
 * 图片处理选项
 */
export interface ImageProcessOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  // 新增选项
  rotate?: number
  grayscale?: boolean
  blur?: number
  sharpen?: boolean
  watermark?: {
    text?: string
    image?: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity?: number
  }
  metadata?: boolean // 是否保留原始元数据
}

/**
 * 图片处理结果
 */
export interface ImageProcessResult {
  success: boolean
  path?: string
  width?: number
  height?: number
  format?: string
  size?: number
  originalSize?: number
  metadata?: any
  error?: string
}

/**
 * 处理图片
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param options 处理选项
 * @returns 处理结果
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  options: ImageProcessOptions = {}
): Promise<ImageProcessResult> {
  try {
    // 验证输入参数
    if (!inputPath) {
      throw new Error('输入路径不能为空')
    }

    if (!outputPath) {
      throw new Error('输出路径不能为空')
    }

    // 检查输入文件是否存在
    try {
      await fs.access(inputPath)
    } catch (error) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 获取原始文件大小
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

    // 设置默认选项
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      format = 'webp',
      fit = 'inside',
      rotate = 0,
      grayscale = false,
      blur = 0,
      sharpen = false,
      watermark,
      metadata: keepMetadata = false,
    } = options

    // 验证选项
    if (maxWidth <= 0 || maxHeight <= 0) {
      throw new Error('宽度和高度必须大于0')
    }

    if (quality < 1 || quality > 100) {
      throw new Error('质量必须在1-100之间')
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // 获取原始图片信息
    const metadata = await sharp(inputPath).metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error('无法获取图片尺寸')
    }

    // 计算调整后的尺寸
    let width = metadata.width
    let height = metadata.height

    // 如果图片尺寸超过最大限制，按比例缩小
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height

      if (width > maxWidth) {
        width = maxWidth
        height = Math.round(width / aspectRatio)
      }

      if (height > maxHeight) {
        height = maxHeight
        width = Math.round(height * aspectRatio)
      }
    }

    // 处理图片
    let sharpInstance = sharp(inputPath, {
      failOnError: false, // 尝试处理损坏的图片
      animated: true // 支持处理GIF等动画图片
    })

    // 应用变换
    sharpInstance = sharpInstance.resize({
      width,
      height,
      fit,
      withoutEnlargement: true,
    })

    // 应用旋转
    if (rotate !== 0) {
      sharpInstance = sharpInstance.rotate(rotate)
    }

    // 应用灰度
    if (grayscale) {
      sharpInstance = sharpInstance.grayscale()
    }

    // 应用模糊
    if (blur > 0) {
      sharpInstance = sharpInstance.blur(blur)
    }

    // 应用锐化
    if (sharpen) {
      sharpInstance = sharpInstance.sharpen()
    }

    // 应用水印
    if (watermark) {
      if (watermark.text) {
        // 文本水印需要额外处理，这里简化处理
        // 实际项目中可能需要使用canvas或其他库来生成文本水印
        console.log('文本水印功能尚未实现')
      } else if (watermark.image) {
        try {
          const watermarkBuffer = await fs.readFile(watermark.image)
          const position = watermark.position || 'bottom-right'
          const opacity = watermark.opacity || 0.5

          // 计算水印位置
          let gravity: sharp.Gravity
          switch (position) {
            case 'top-left': gravity = 'northwest'; break
            case 'top-right': gravity = 'northeast'; break
            case 'bottom-left': gravity = 'southwest'; break
            case 'bottom-right': gravity = 'southeast'; break
            case 'center': gravity = 'center'; break
            default: gravity = 'southeast'
          }

          // 应用水印
          sharpInstance = sharpInstance.composite([{
            input: watermarkBuffer,
            gravity,
            blend: 'over',
            // 透明度需要通过调整水印图片本身来实现
          }])
        } catch (error) {
          console.error('应用水印失败:', error)
        }
      }
    }

    // 保留元数据
    if (keepMetadata) {
      sharpInstance = sharpInstance.withMetadata()
    }

    // 根据指定格式输出
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          lossless: quality === 100, // 质量100时使用无损压缩
          smartSubsample: true, // 智能二次采样以提高质量
        })
        break
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true, // 渐进式JPEG
          optimizeCoding: true, // 优化霍夫曼编码
          mozjpeg: true, // 使用mozjpeg优化
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9, // 最高压缩级别
          palette: quality < 100, // 质量小于100时使用调色板
        })
        break
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          lossless: quality === 100, // 质量100时使用无损压缩
        })
        break
      default:
        throw new Error(`不支持的输出格式: ${format}`)
    }

    // 保存处理后的图片
    await sharpInstance.toFile(outputPath)

    // 获取处理后的图片信息
    const outputMetadata = await sharp(outputPath).metadata()
    const stats = await fs.stat(outputPath)

    return {
      success: true,
      path: outputPath,
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: outputMetadata.format,
      size: stats.size,
      originalSize,
      metadata: keepMetadata ? outputMetadata : undefined,
    }
  } catch (error) {
    console.error('图片处理失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图片处理失败',
    }
  }
}

/**
 * 生成缩略图
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param options 缩略图选项
 * @returns 处理结果
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  options: {
    width?: number
    height?: number
    quality?: number
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  } = {}
): Promise<ImageProcessResult> {
  const {
    width = 300,
    height = 300,
    quality = 70,
    fit = 'cover'
  } = options

  return processImage(inputPath, outputPath, {
    maxWidth: width,
    maxHeight: height,
    quality,
    format: 'webp',
    fit,
  })
}

/**
 * 视频处理选项
 */
export interface VideoProcessOptions {
  generateThumbnail?: boolean
  thumbnailTime?: number // 缩略图时间点（秒）
  thumbnailCount?: number // 生成多张缩略图
  maxWidth?: number
  maxHeight?: number
  quality?: number // 视频质量 (CRF值，越低质量越高，通常在18-28之间)
  format?: 'mp4' | 'webm' | 'gif' // 输出格式
  codec?: 'h264' | 'h265' | 'vp9' // 视频编码
  audioCodec?: 'aac' | 'opus' | 'mp3' // 音频编码
  audioBitrate?: string // 音频比特率，如 '128k'
  fps?: number // 帧率
  startTime?: number // 裁剪起始时间（秒）
  duration?: number // 裁剪持续时间（秒）
  fastStart?: boolean // 优化网络播放
  metadata?: boolean // 是否保留原始元数据
}

/**
 * 视频处理结果
 */
export interface VideoProcessResult {
  success: boolean
  path?: string
  thumbnailPath?: string
  thumbnailPaths?: string[] // 多张缩略图路径
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
 * @param videoPath 视频文件路径
 * @returns 视频信息
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
    // 使用ffprobe获取视频信息
    const { stdout } = await execPromise(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,codec_name,r_frame_rate,bit_rate:format=format_name -show_entries stream_tags=rotate -of json "${videoPath}"`
    )

    const info = JSON.parse(stdout)
    const videoStream = info.streams?.[0]

    if (!videoStream) {
      return null
    }

    // 解析帧率（可能是分数形式，如"30000/1001"）
    let fps: number | undefined
    if (videoStream.r_frame_rate) {
      const [numerator, denominator] = videoStream.r_frame_rate.split('/')
      fps = Math.round((parseInt(numerator) / parseInt(denominator)) * 100) / 100
    }

    // 获取音频信息
    const { stdout: audioStdout } = await execPromise(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,bit_rate -of json "${videoPath}"`
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
 * 注意：此函数需要系统安装ffmpeg
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param options 处理选项
 * @returns 处理结果
 */
export async function processVideo(
  inputPath: string,
  outputPath: string,
  options: VideoProcessOptions = {}
): Promise<VideoProcessResult> {
  try {
    // 验证输入参数
    if (!inputPath) {
      throw new Error('输入路径不能为空')
    }

    if (!outputPath) {
      throw new Error('输出路径不能为空')
    }

    // 检查输入文件是否存在
    try {
      await fs.access(inputPath)
    } catch (error) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 获取原始文件大小
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

    // 设置默认选项
    const {
      generateThumbnail = true,
      thumbnailTime = 0,
      thumbnailCount = 1,
      maxWidth = 1280,
      maxHeight = 720,
      quality = 23, // ffmpeg的crf值，越低质量越高，通常在18-28之间
      format = 'mp4',
      codec = 'h264',
      audioCodec = 'aac',
      audioBitrate = '128k',
      fps,
      startTime,
      duration,
      fastStart = true,
      metadata = false,
    } = options

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // 获取视频信息
    const videoInfo = await getVideoInfo(inputPath)
    if (!videoInfo) {
      throw new Error('无法获取视频信息')
    }

    // 构建ffmpeg命令
    let ffmpegCmd = `ffmpeg -i "${inputPath}" `

    // 添加裁剪参数
    if (startTime !== undefined) {
      ffmpegCmd += `-ss ${startTime} `
    }

    if (duration !== undefined) {
      ffmpegCmd += `-t ${duration} `
    }

    // 添加缩放参数
    const scale = `-vf "scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease"`
    ffmpegCmd += `${scale} `

    // 添加帧率参数
    if (fps) {
      ffmpegCmd += `-r ${fps} `
    }

    // 添加视频编码参数
    switch (codec) {
      case 'h264':
        ffmpegCmd += `-c:v libx264 -crf ${quality} -preset medium `
        break
      case 'h265':
        ffmpegCmd += `-c:v libx265 -crf ${quality} -preset medium `
        break
      case 'vp9':
        ffmpegCmd += `-c:v libvpx-vp9 -crf ${quality} -b:v 0 `
        break
    }

    // 添加音频编码参数
    switch (audioCodec) {
      case 'aac':
        ffmpegCmd += `-c:a aac -b:a ${audioBitrate} `
        break
      case 'opus':
        ffmpegCmd += `-c:a libopus -b:a ${audioBitrate} `
        break
      case 'mp3':
        ffmpegCmd += `-c:a libmp3lame -b:a ${audioBitrate} `
        break
    }

    // 添加格式参数
    switch (format) {
      case 'mp4':
        if (fastStart) {
          ffmpegCmd += `-movflags +faststart `
        }
        break
      case 'webm':
        // webm格式不需要特殊参数
        break
      case 'gif':
        // 对于GIF，使用特殊的调色板生成
        ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "fps=10,scale=${maxWidth}:${maxHeight}:force_original_aspect_ratio=decrease,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" `
        break
    }

    // 添加元数据参数
    if (metadata) {
      ffmpegCmd += `-map_metadata 0 `
    } else {
      ffmpegCmd += `-map_metadata -1 `
    }

    // 添加输出文件
    ffmpegCmd += `"${outputPath}" -y`

    // 执行ffmpeg命令
    await execPromise(ffmpegCmd)

    // 获取处理后的视频信息
    const processedInfo = await getVideoInfo(outputPath)
    const stats = await fs.stat(outputPath)

    // 生成缩略图
    let thumbnailPath: string | undefined
    let thumbnailPaths: string[] | undefined

    if (generateThumbnail) {
      if (thumbnailCount <= 1) {
        // 生成单张缩略图
        thumbnailPath = outputPath.replace(/\.[^.]+$/, '_thumb.webp')

        // 使用ffmpeg生成缩略图
        const thumbCmd = `ffmpeg -i "${outputPath}" -ss ${thumbnailTime} -vframes 1 -f image2 "${thumbnailPath}" -y`
        await execPromise(thumbCmd)
      } else {
        // 生成多张缩略图
        thumbnailPaths = []
        const videoDuration = processedInfo?.duration || 0

        if (videoDuration > 0) {
          const interval = videoDuration / (thumbnailCount + 1)

          for (let i = 1; i <= thumbnailCount; i++) {
            const thumbTime = interval * i
            const thumbPath = outputPath.replace(/\.[^.]+$/, `_thumb${i}.webp`)

            // 使用ffmpeg生成缩略图
            const thumbCmd = `ffmpeg -i "${outputPath}" -ss ${thumbTime} -vframes 1 -f image2 "${thumbPath}" -y`
            await execPromise(thumbCmd)

            thumbnailPaths.push(thumbPath)
          }
        }

        // 设置第一张缩略图为主缩略图
        if (thumbnailPaths.length > 0) {
          thumbnailPath = thumbnailPaths[0]
        }
      }
    }

    return {
      success: true,
      path: outputPath,
      thumbnailPath,
      thumbnailPaths,
      width: processedInfo?.width,
      height: processedInfo?.height,
      duration: processedInfo?.duration,
      size: stats.size,
      originalSize,
      format: processedInfo?.format,
      codec: processedInfo?.codec,
      fps: processedInfo?.fps,
      bitrate: processedInfo?.bitrate,
      metadata: processedInfo,
    }
  } catch (error) {
    console.error('视频处理失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '视频处理失败',
    }
  }
}

/**
 * 音频处理选项
 */
export interface AudioProcessOptions {
  quality?: number // 音频质量 (0-100)
  format?: 'mp3' | 'aac' | 'ogg' | 'wav' // 输出格式
  bitrate?: string // 比特率，如 '128k'
  sampleRate?: number // 采样率，如 44100
  channels?: number // 声道数，1为单声道，2为立体声
  normalize?: boolean // 是否标准化音量
  startTime?: number // 裁剪起始时间（秒）
  duration?: number // 裁剪持续时间（秒）
  metadata?: boolean // 是否保留原始元数据
}

/**
 * 音频处理结果
 */
export interface AudioProcessResult {
  success: boolean
  path?: string
  duration?: number
  size?: number
  originalSize?: number
  format?: string
  codec?: string
  bitrate?: number
  sampleRate?: number
  channels?: number
  metadata?: any
  error?: string
}

/**
 * 获取音频信息
 * @param audioPath 音频文件路径
 * @returns 音频信息
 */
export async function getAudioInfo(audioPath: string): Promise<{
  duration?: number
  format?: string
  codec?: string
  bitrate?: number
  sampleRate?: number
  channels?: number
} | null> {
  try {
    // 使用ffprobe获取音频信息
    const { stdout } = await execPromise(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,bit_rate,sample_rate,channels:format=format_name,duration -of json "${audioPath}"`
    )

    const info = JSON.parse(stdout)
    const audioStream = info.streams?.[0]

    if (!audioStream) {
      return null
    }

    return {
      duration: parseFloat(audioStream.duration || info.format?.duration || '0'),
      format: info.format?.format_name,
      codec: audioStream.codec_name,
      bitrate: parseInt(audioStream.bit_rate || info.format?.bit_rate || '0'),
      sampleRate: parseInt(audioStream.sample_rate || '0'),
      channels: parseInt(audioStream.channels || '0')
    }
  } catch (error) {
    console.error('获取音频信息失败:', error)
    return null
  }
}

/**
 * 处理音频
 * 注意：此函数需要系统安装ffmpeg
 * @param inputPath 输入文件路径
 * @param outputPath 输出文件路径
 * @param options 处理选项
 * @returns 处理结果
 */
export async function processAudio(
  inputPath: string,
  outputPath: string,
  options: AudioProcessOptions = {}
): Promise<AudioProcessResult> {
  try {
    // 验证输入参数
    if (!inputPath) {
      throw new Error('输入路径不能为空')
    }

    if (!outputPath) {
      throw new Error('输出路径不能为空')
    }

    // 检查输入文件是否存在
    try {
      await fs.access(inputPath)
    } catch (error) {
      throw new Error(`输入文件不存在: ${inputPath}`)
    }

    // 获取原始文件大小
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

    // 设置默认选项
    const {
      quality = 4, // ffmpeg的音频质量，对于mp3，范围是0-9，值越小质量越高
      format = 'mp3',
      bitrate = '128k',
      sampleRate = 44100,
      channels = 2,
      normalize = false,
      startTime,
      duration,
      metadata = false,
    } = options

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // 获取音频信息
    const audioInfo = await getAudioInfo(inputPath)
    if (!audioInfo) {
      throw new Error('无法获取音频信息')
    }

    // 构建ffmpeg命令
    let ffmpegCmd = `ffmpeg -i "${inputPath}" `

    // 添加裁剪参数
    if (startTime !== undefined) {
      ffmpegCmd += `-ss ${startTime} `
    }

    if (duration !== undefined) {
      ffmpegCmd += `-t ${duration} `
    }

    // 添加音频处理参数
    let filterComplex = ''

    if (normalize) {
      filterComplex += 'loudnorm,'
    }

    if (filterComplex) {
      ffmpegCmd += `-af "${filterComplex.slice(0, -1)}" `
    }

    // 添加采样率和声道参数
    ffmpegCmd += `-ar ${sampleRate} -ac ${channels} `

    // 添加编码参数
    switch (format) {
      case 'mp3':
        ffmpegCmd += `-c:a libmp3lame -q:a ${quality} `
        break
      case 'aac':
        ffmpegCmd += `-c:a aac -b:a ${bitrate} `
        break
      case 'ogg':
        ffmpegCmd += `-c:a libvorbis -q:a ${quality} `
        break
      case 'wav':
        ffmpegCmd += `-c:a pcm_s16le `
        break
    }

    // 添加元数据参数
    if (metadata) {
      ffmpegCmd += `-map_metadata 0 `
    } else {
      ffmpegCmd += `-map_metadata -1 `
    }

    // 添加输出文件
    ffmpegCmd += `"${outputPath}" -y`

    // 执行ffmpeg命令
    await execPromise(ffmpegCmd)

    // 获取处理后的音频信息
    const processedInfo = await getAudioInfo(outputPath)
    const stats = await fs.stat(outputPath)

    return {
      success: true,
      path: outputPath,
      duration: processedInfo?.duration,
      size: stats.size,
      originalSize,
      format: processedInfo?.format,
      codec: processedInfo?.codec,
      bitrate: processedInfo?.bitrate,
      sampleRate: processedInfo?.sampleRate,
      channels: processedInfo?.channels,
      metadata: processedInfo,
    }
  } catch (error) {
    console.error('音频处理失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '音频处理失败',
    }
  }
}

/**
 * 获取媒体类型
 * @param mimeType MIME类型
 * @returns 媒体类型
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) {
    return MediaType.IMAGE
  } else if (mimeType.startsWith('video/')) {
    return MediaType.VIDEO
  } else if (mimeType.startsWith('audio/')) {
    return MediaType.AUDIO
  } else if (
    mimeType === 'application/vnd.apple.mpegurl' ||
    mimeType === 'application/x-mpegURL' ||
    mimeType === 'application/dash+xml'
  ) {
    // 流媒体格式
    return MediaType.CLOUD_VIDEO
  } else {
    // 尝试根据文件扩展名判断
    const extension = mimeType.split('/').pop()?.toLowerCase()
    if (extension) {
      // 图片扩展名
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(extension)) {
        return MediaType.IMAGE
      }
      // 视频扩展名
      if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(extension)) {
        return MediaType.VIDEO
      }
      // 音频扩展名
      if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(extension)) {
        return MediaType.AUDIO
      }
    }

    // 默认为图片类型
    return MediaType.IMAGE
  }
}

/**
 * 格式化媒体信息
 * @param media 媒体数据
 * @returns 格式化后的媒体信息
 */
export function formatMediaInfo(media: any): MediaResponse {
  // 获取最新版本的缩略图
  const latestVersion = media.versions?.[0]

  return {
    id: media.id,
    uuid: media.uuid,
    type: media.type,
    url: media.url,
    title: media.title || null,
    description: media.description || null,
    fileSize: media.fileSize || null,
    mimeType: media.mimeType || null,
    width: media.width || null,
    height: media.height || null,
    duration: media.duration || null,
    thumbnailUrl: latestVersion?.thumbnailUrl || null,
    storageType: media.storageType || 'LOCAL',
    status: media.status || 'ACTIVE',
    usageCount: media.usageCount || 0,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    user: media.user ? {
      id: media.user.id,
      name: media.user.name,
    } : undefined,
    category: media.category ? {
      id: media.category.id,
      uuid: media.category.uuid,
      name: media.category.name,
      slug: media.category.slug,
    } : undefined,
    tags: media.mediaTags ? media.mediaTags.map((mediaTag: any) => ({
      id: mediaTag.tag.id,
      uuid: mediaTag.tag.uuid,
      name: mediaTag.tag.name,
      color: mediaTag.tag.color,
    })) : undefined,
  }
}

/**
 * 获取媒体文件的存储路径
 * @param userId 用户ID
 * @param filename 文件名
 * @returns 存储路径
 */
export function getMediaStoragePath(userId: number, filename: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return path.join('public', 'uploads', 'media', `${year}${month}${day}`, `${userId}`, filename)
}

/**
 * 获取媒体文件的URL路径
 * @param storagePath 存储路径
 * @returns URL路径
 */
export function getMediaUrl(storagePath: string): string {
  // 移除public前缀，转换为URL路径，并确保使用正斜杠
  return storagePath.replace(/^public/, '').replace(/\\/g, '/')
}