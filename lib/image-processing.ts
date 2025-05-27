import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

/**
 * 图片处理选项
 */
export interface ImageProcessOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
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
  metadata?: boolean
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
 */
export async function processImage(
  inputPath: string,
  outputPath: string,
  options: ImageProcessOptions = {}
): Promise<ImageProcessResult> {
  try {
    if (!inputPath || !outputPath) {
      throw new Error('输入路径和输出路径不能为空')
    }

    await fs.access(inputPath)
    const originalStats = await fs.stat(inputPath)
    const originalSize = originalStats.size

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

    if (maxWidth <= 0 || maxHeight <= 0) {
      throw new Error('宽度和高度必须大于0')
    }

    if (quality < 1 || quality > 100) {
      throw new Error('质量必须在1-100之间')
    }

    const outputDir = path.dirname(outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    const metadata = await sharp(inputPath).metadata()
    if (!metadata.width || !metadata.height) {
      throw new Error('无法获取图片尺寸')
    }

    let width = metadata.width
    let height = metadata.height

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

    let sharpInstance = sharp(inputPath, {
      failOnError: false,
      animated: true
    })

    sharpInstance = sharpInstance.resize({
      width,
      height,
      fit,
      withoutEnlargement: true,
    })

    if (rotate !== 0) {
      sharpInstance = sharpInstance.rotate(rotate)
    }

    if (grayscale) {
      sharpInstance = sharpInstance.grayscale()
    }

    if (blur > 0) {
      sharpInstance = sharpInstance.blur(blur)
    }

    if (sharpen) {
      sharpInstance = sharpInstance.sharpen()
    }

    if (watermark?.image) {
      try {
        const watermarkBuffer = await fs.readFile(watermark.image)
        const position = watermark.position || 'bottom-right'
        
        let gravity: sharp.Gravity
        switch (position) {
          case 'top-left': gravity = 'northwest'; break
          case 'top-right': gravity = 'northeast'; break
          case 'bottom-left': gravity = 'southwest'; break
          case 'bottom-right': gravity = 'southeast'; break
          case 'center': gravity = 'center'; break
          default: gravity = 'southeast'
        }

        sharpInstance = sharpInstance.composite([{
          input: watermarkBuffer,
          gravity,
          blend: 'over',
        }])
      } catch (error) {
        console.error('应用水印失败:', error)
      }
    }

    if (keepMetadata) {
      sharpInstance = sharpInstance.withMetadata()
    }

    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          lossless: quality === 100,
          smartSubsample: true,
        })
        break
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true,
          optimizeCoding: true,
          mozjpeg: true,
        })
        break
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 9,
          palette: quality < 100,
        })
        break
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          lossless: quality === 100,
        })
        break
      default:
        throw new Error(`不支持的输出格式: ${format}`)
    }

    await sharpInstance.toFile(outputPath)

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
