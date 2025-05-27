import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { 
  calculateFileHash, 
  findExistingFileByHash, 
  getHashBasedStoragePath, 
  getThumbnailPath,
  createFileHashRecord,
  incrementRefCount,
  filePathToUrl
} from '@/lib/file-deduplication'
import { 
  processImage, 
  processVideo, 
  processAudio, 
  generateThumbnail,
  getMediaType 
} from '@/lib/media'

export interface DeduplicationUploadResult {
  success: boolean
  media?: any
  isDuplicate: boolean
  spaceSaved?: number
  error?: string
}

/**
 * 带去重功能的文件上传处理
 * @param file 上传的文件信息
 * @param userId 用户ID
 * @param metadata 媒体元数据
 * @returns 上传结果
 */
export async function uploadWithDeduplication(
  file: {
    filepath: string
    originalFilename?: string
    mimetype?: string
    size: number
  },
  userId: number,
  metadata: {
    title?: string
    description?: string
    categoryId?: number
    tagIds?: number[]
  } = {}
): Promise<DeduplicationUploadResult> {
  let tempFilePath: string | null = null
  
  try {
    // 1. 计算文件哈希
    console.log('🔍 计算文件哈希...')
    const hash = await calculateFileHash(file.filepath)
    console.log(`📝 文件哈希: ${hash}`)
    
    // 2. 检查是否已存在相同文件
    const existingFile = await findExistingFileByHash(hash)
    
    if (existingFile) {
      console.log('🔄 发现重复文件，使用现有文件')
      
      // 3. 增加引用计数
      await incrementRefCount(existingFile.id)
      
      // 4. 创建新的Media记录，指向现有的FileHash
      const media = await createMediaRecord(userId, existingFile, metadata)
      
      // 5. 清理临时文件
      try {
        await fs.unlink(file.filepath)
      } catch (error) {
        console.warn('清理临时文件失败:', error)
      }
      
      return {
        success: true,
        media,
        isDuplicate: true,
        spaceSaved: file.size
      }
    }
    
    // 6. 新文件，需要处理和存储
    console.log('📁 处理新文件...')
    return await processAndStoreNewFile(file, userId, hash, metadata)
    
  } catch (error) {
    console.error('去重上传失败:', error)
    
    // 清理临时文件
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError)
      }
    }
    
    return {
      success: false,
      isDuplicate: false,
      error: error instanceof Error ? error.message : '上传失败'
    }
  }
}

/**
 * 处理和存储新文件
 */
async function processAndStoreNewFile(
  file: {
    filepath: string
    originalFilename?: string
    mimetype?: string
    size: number
  },
  userId: number,
  hash: string,
  metadata: {
    title?: string
    description?: string
    categoryId?: number
    tagIds?: number[]
  }
): Promise<DeduplicationUploadResult> {
  try {
    // 确定媒体类型和文件扩展名
    const mediaType = getMediaType(file.mimetype || '')
    const originalFilename = file.originalFilename || 'file'
    const fileExtension = path.extname(originalFilename).toLowerCase() || '.bin'
    
    // 生成基于哈希的存储路径
    const storagePath = getHashBasedStoragePath(hash, fileExtension)
    const thumbnailPath = getThumbnailPath(hash)
    
    // 确保目录存在
    await fs.mkdir(path.dirname(storagePath), { recursive: true })
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true })
    
    // 处理媒体文件
    let width: number | undefined
    let height: number | undefined
    let duration: number | undefined
    let processedSize: number
    let finalMimeType = file.mimetype || 'application/octet-stream'
    let hasThumbnail = false
    
    if (mediaType === 'IMAGE') {
      // 处理图片
      const result = await processImage(file.filepath, storagePath, {
        maxWidth: 2048,
        maxHeight: 1536,
        quality: 85,
        format: 'webp'
      })
      
      if (!result.success) {
        throw new Error(`图片处理失败: ${result.error}`)
      }
      
      width = result.width
      height = result.height
      processedSize = result.size || file.size
      finalMimeType = 'image/webp'
      
      // 生成缩略图
      const thumbResult = await generateThumbnail(file.filepath, thumbnailPath, {
        width: 400,
        height: 400,
        quality: 75,
        fit: 'cover'
      })
      
      hasThumbnail = thumbResult.success
      
    } else if (mediaType === 'VIDEO') {
      // 处理视频
      const result = await processVideo(file.filepath, storagePath, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 23,
        format: 'mp4'
      })
      
      if (!result.success) {
        throw new Error(`视频处理失败: ${result.error}`)
      }
      
      width = result.width
      height = result.height
      duration = result.duration
      processedSize = result.size || file.size
      finalMimeType = 'video/mp4'
      
      // 生成视频缩略图
      const thumbResult = await generateThumbnail(file.filepath, thumbnailPath, {
        width: 400,
        height: 400,
        quality: 75,
        fit: 'cover'
      })
      
      hasThumbnail = thumbResult.success
      
    } else if (mediaType === 'AUDIO') {
      // 处理音频
      const result = await processAudio(file.filepath, storagePath)
      
      if (!result.success) {
        throw new Error(`音频处理失败: ${result.error}`)
      }
      
      duration = result.duration
      processedSize = result.size || file.size
      
    } else {
      // 直接复制其他类型文件
      await fs.copyFile(file.filepath, storagePath)
      processedSize = file.size
    }
    
    // 创建FileHash记录
    const fileHash = await createFileHashRecord({
      hash,
      filePath: storagePath,
      fileSize: processedSize,
      mimeType: finalMimeType,
      width,
      height,
      duration,
      thumbnailPath: hasThumbnail ? thumbnailPath : undefined
    })
    
    // 创建Media记录
    const media = await createMediaRecord(userId, fileHash, metadata)
    
    // 清理临时文件
    try {
      await fs.unlink(file.filepath)
    } catch (error) {
      console.warn('清理临时文件失败:', error)
    }
    
    console.log(`✅ 新文件处理完成: ${hash}`)
    
    return {
      success: true,
      media,
      isDuplicate: false
    }
    
  } catch (error) {
    console.error('处理新文件失败:', error)
    throw error
  }
}

/**
 * 创建Media记录
 */
async function createMediaRecord(
  userId: number,
  fileHash: any,
  metadata: {
    title?: string
    description?: string
    categoryId?: number
    tagIds?: number[]
  }
) {
  const url = filePathToUrl(fileHash.filePath)
  const thumbnailUrl = fileHash.thumbnailPath ? filePathToUrl(fileHash.thumbnailPath) : undefined
  
  // 确定媒体类型
  const mediaType = getMediaType(fileHash.mimeType)
  
  return await prisma.media.create({
    data: {
      type: mediaType,
      url,
      title: metadata.title,
      description: metadata.description,
      thumbnailUrl,
      userId,
      categoryId: metadata.categoryId,
      fileHashId: fileHash.id,
      mediaTags: metadata.tagIds && metadata.tagIds.length > 0 ? {
        connect: metadata.tagIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      category: true,
      mediaTags: true,
      fileHash: true,
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}
