/**
 * 视频压缩优化器
 * 提供智能的视频压缩策略和参数优化
 */

export interface VideoAnalysis {
  width: number
  height: number
  duration: number
  bitrate: number
  fps: number
  hasAudio: boolean
  complexity: 'low' | 'medium' | 'high'
  motionLevel: 'static' | 'low' | 'medium' | 'high'
  contentType: 'animation' | 'live' | 'screen' | 'mixed'
}

export interface OptimizedCompressionParams {
  crf: number
  preset: string
  maxWidth: number
  maxHeight: number
  targetBitrate?: string
  audioBitrate: string
  audioSampleRate: number
  twoPass: boolean
  codec: 'h264' | 'h265' | 'av1'
  estimatedTime: number
  estimatedSize: number
  compressionRatio: number
}

export class VideoCompressionOptimizer {
  /**
   * 分析视频内容特征
   */
  static async analyzeVideo(inputPath: string): Promise<VideoAnalysis> {
    // 这里应该使用 ffprobe 进行详细分析
    // 简化版本，实际应该分析运动向量、场景复杂度等

    try {
      // 直接导入而不是动态导入
      const { execPromise, FFMPEG_PATHS } = require('./media')

      // 获取基本信息
      const { stdout } = await execPromise(
        `"${FFMPEG_PATHS.ffprobe}" -v quiet -print_format json -show_format -show_streams "${inputPath}"`
      )

      const info = JSON.parse(stdout)
      const videoStream = info.streams.find((s: any) => s.codec_type === 'video')
      const audioStream = info.streams.find((s: any) => s.codec_type === 'audio')

      if (!videoStream) {
        throw new Error('无法找到视频流')
      }

      // 简单的复杂度分析（实际应该更复杂）
      const width = parseInt(videoStream.width)
      const height = parseInt(videoStream.height)
      const fps = eval(videoStream.r_frame_rate) || 30
      const bitrate = parseInt(videoStream.bit_rate || info.format.bit_rate || '0')

      // 基于分辨率和比特率估算复杂度
      const pixelCount = width * height
      const complexity = pixelCount > 1920 * 1080 ? 'high' :
                        pixelCount > 1280 * 720 ? 'medium' : 'low'

      // 基于比特率估算运动水平
      const bitratePerPixel = bitrate / pixelCount
      const motionLevel = bitratePerPixel > 0.1 ? 'high' :
                         bitratePerPixel > 0.05 ? 'medium' : 'low'

      return {
        width,
        height,
        duration: parseFloat(info.format.duration || '0'),
        bitrate,
        fps,
        hasAudio: !!audioStream,
        complexity,
        motionLevel,
        contentType: 'mixed' // 简化版本，实际需要更复杂的分析
      }
    } catch (error) {
      console.error('视频分析失败:', error)
      // 返回默认值
      return {
        width: 1920,
        height: 1080,
        duration: 0,
        bitrate: 5000000,
        fps: 30,
        hasAudio: true,
        complexity: 'medium',
        motionLevel: 'medium',
        contentType: 'mixed'
      }
    }
  }

  /**
   * 根据分析结果生成优化的压缩参数
   */
  static generateOptimizedParams(
    analysis: VideoAnalysis,
    targetSize: number,
    maxProcessingTime: number = 180 // 3分钟
  ): OptimizedCompressionParams {

    // 基础参数
    let crf = 23
    let preset = 'medium'
    let codec: 'h264' | 'h265' | 'av1' = 'h264'
    let twoPass = false

    // 根据内容复杂度调整 CRF
    switch (analysis.complexity) {
      case 'low':
        crf = analysis.motionLevel === 'static' ? 28 : 25
        break
      case 'medium':
        crf = analysis.motionLevel === 'high' ? 20 : 23
        break
      case 'high':
        crf = analysis.motionLevel === 'high' ? 18 : 21
        break
    }

    // 根据处理时间限制选择预设和编码器
    if (maxProcessingTime < 60) {
      preset = 'veryfast'
      codec = 'h264' // 快速处理使用H.264
    } else if (maxProcessingTime < 120) {
      preset = 'fast'
      codec = 'h264'
    } else if (maxProcessingTime < 300) {
      preset = 'medium'
      codec = 'h264'
    } else {
      preset = 'slow'
      codec = 'h265' // 时间充足时使用H.265获得更好压缩
      twoPass = true // 时间充足时使用两阶段编码
    }

    // 智能分辨率调整
    let maxWidth = analysis.width
    let maxHeight = analysis.height

    // 如果目标文件大小较小，降低分辨率
    const currentBitrate = analysis.bitrate
    const targetBitrate = (targetSize * 8) / analysis.duration // 目标比特率

    if (targetBitrate < currentBitrate * 0.3) {
      // 需要大幅压缩，降低分辨率
      if (analysis.width > 1280) {
        maxWidth = 1280
        maxHeight = 720
      } else if (analysis.width > 854) {
        maxWidth = 854
        maxHeight = 480
      }
    } else if (targetBitrate < currentBitrate * 0.6) {
      // 中等压缩
      if (analysis.width > 1920) {
        maxWidth = 1920
        maxHeight = 1080
      }
    }

    // 音频比特率优化
    let audioBitrate = '128k'
    if (analysis.hasAudio) {
      if (analysis.contentType === 'animation' || analysis.motionLevel === 'static') {
        audioBitrate = '96k' // 动画或静态内容可以降低音频比特率
      } else if (analysis.complexity === 'high') {
        audioBitrate = '160k' // 高复杂度内容保持较高音频质量
      }
    }

    // 估算处理时间（基于经验公式）
    const pixelCount = maxWidth * maxHeight
    const durationFactor = Math.min(analysis.duration, 300) // 最多按5分钟计算
    const complexityMultiplier = {
      'veryfast': 0.1,
      'fast': 0.2,
      'medium': 0.5,
      'slow': 1.0
    }[preset] || 0.5

    const estimatedTime = (pixelCount / 1000000) * durationFactor * complexityMultiplier

    // 估算文件大小（基于目标比特率）
    const videoBitrate = this.calculateTargetBitrate(analysis, maxWidth, maxHeight, crf)
    const audioBitrateNum = parseInt(audioBitrate.replace('k', '')) * 1000
    const totalBitrate = videoBitrate + audioBitrateNum
    const estimatedSize = (totalBitrate * analysis.duration) / 8

    const compressionRatio = 1 - (estimatedSize / (analysis.bitrate * analysis.duration / 8))

    return {
      crf,
      preset,
      maxWidth,
      maxHeight,
      audioBitrate,
      audioSampleRate: 44100,
      twoPass,
      codec,
      estimatedTime,
      estimatedSize,
      compressionRatio,
      targetBitrate: `${Math.round(videoBitrate / 1000)}k`
    }
  }

  /**
   * 计算目标视频比特率
   */
  private static calculateTargetBitrate(
    analysis: VideoAnalysis,
    width: number,
    height: number,
    crf: number
  ): number {
    // 基于分辨率的基础比特率
    const pixelCount = width * height
    let baseBitrate: number

    if (pixelCount <= 640 * 480) {
      baseBitrate = 1000000 // 1Mbps for 480p
    } else if (pixelCount <= 1280 * 720) {
      baseBitrate = 2500000 // 2.5Mbps for 720p
    } else if (pixelCount <= 1920 * 1080) {
      baseBitrate = 5000000 // 5Mbps for 1080p
    } else {
      baseBitrate = 10000000 // 10Mbps for 4K
    }

    // 根据 CRF 调整
    const crfMultiplier = Math.pow(0.8, (23 - crf)) // CRF每降低1，比特率约增加25%

    // 根据内容复杂度调整
    const complexityMultiplier = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.4
    }[analysis.complexity]

    // 根据运动水平调整
    const motionMultiplier = {
      'static': 0.5,
      'low': 0.8,
      'medium': 1.0,
      'high': 1.3
    }[analysis.motionLevel]

    return baseBitrate * crfMultiplier * complexityMultiplier * motionMultiplier
  }

  /**
   * 生成优化的 FFmpeg 命令参数
   */
  static generateFFmpegParams(params: OptimizedCompressionParams): string[] {
    const args: string[] = []

    // 视频编码参数
    args.push('-c:v', `lib${params.codec}`)
    args.push('-crf', params.crf.toString())
    args.push('-preset', params.preset)

    // 分辨率
    args.push('-vf', `scale='min(${params.maxWidth},iw)':'min(${params.maxHeight},ih)':force_original_aspect_ratio=decrease`)

    // 音频编码参数
    args.push('-c:a', 'aac')
    args.push('-b:a', params.audioBitrate)
    args.push('-ar', params.audioSampleRate.toString())

    // 优化参数
    args.push('-movflags', '+faststart')
    args.push('-pix_fmt', 'yuv420p')

    // H.264 特定优化
    if (params.codec === 'h264') {
      args.push('-profile:v', 'high')
      args.push('-level', '4.1')

      // 根据预设添加额外优化
      if (params.preset === 'slow') {
        args.push('-x264-params', 'ref=5:bframes=5:subme=8:me_range=16:rc_lookahead=25')
      } else if (params.preset === 'medium') {
        args.push('-x264-params', 'ref=3:bframes=3:subme=6:me_range=12:rc_lookahead=15')
      }
    }

    return args
  }
}

export default VideoCompressionOptimizer
