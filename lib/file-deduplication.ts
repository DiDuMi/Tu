import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

/**
 * 计算文件的SHA-256哈希值
 * @param filePath 文件路径
 * @returns 哈希值字符串
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(fileBuffer).digest('hex')
  } catch (error) {
    console.error('计算文件哈希失败:', error)
    throw new Error(`无法计算文件哈希: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 根据哈希值查找已存在的文件
 * @param hash SHA-256哈希值
 * @returns FileHash记录或null
 */
export async function findExistingFileByHash(hash: string) {
  try {
    return await prisma.fileHash.findUnique({
      where: { hash },
      include: {
        media: {
          where: { deletedAt: null },
          take: 1
        }
      }
    })
  } catch (error) {
    console.error('查找重复文件失败:', error)
    return null
  }
}

/**
 * 生成基于哈希的存储路径
 * @param hash 文件哈希值
 * @param extension 文件扩展名
 * @returns 存储路径
 */
export function getHashBasedStoragePath(hash: string, extension: string): string {
  // 使用哈希前缀创建目录结构，避免单个目录文件过多
  const prefix1 = hash.substring(0, 2)
  const prefix2 = hash.substring(2, 4)
  
  return path.join(
    'public', 
    'uploads', 
    'media', 
    'hashes', 
    prefix1, 
    prefix2, 
    `${hash}${extension}`
  )
}

/**
 * 生成缩略图存储路径
 * @param hash 文件哈希值
 * @returns 缩略图路径
 */
export function getThumbnailPath(hash: string): string {
  const prefix1 = hash.substring(0, 2)
  const prefix2 = hash.substring(2, 4)
  
  return path.join(
    'public', 
    'uploads', 
    'media', 
    'thumbnails', 
    prefix1, 
    prefix2, 
    `${hash}_thumb.webp`
  )
}

/**
 * 创建FileHash记录
 * @param params FileHash创建参数
 * @returns 创建的FileHash记录
 */
export async function createFileHashRecord(params: {
  hash: string
  filePath: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  duration?: number
  thumbnailPath?: string
}) {
  try {
    return await prisma.fileHash.create({
      data: {
        hash: params.hash,
        filePath: params.filePath,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        width: params.width,
        height: params.height,
        duration: params.duration,
        thumbnailPath: params.thumbnailPath,
        refCount: 1
      }
    })
  } catch (error) {
    console.error('创建FileHash记录失败:', error)
    throw new Error(`创建FileHash记录失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 增加文件引用计数
 * @param fileHashId FileHash记录ID
 * @returns 更新后的FileHash记录
 */
export async function incrementRefCount(fileHashId: number) {
  try {
    return await prisma.fileHash.update({
      where: { id: fileHashId },
      data: { refCount: { increment: 1 } }
    })
  } catch (error) {
    console.error('增加引用计数失败:', error)
    throw new Error(`增加引用计数失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 减少文件引用计数
 * @param fileHashId FileHash记录ID
 * @returns 更新后的FileHash记录
 */
export async function decrementRefCount(fileHashId: number) {
  try {
    const fileHash = await prisma.fileHash.update({
      where: { id: fileHashId },
      data: { refCount: { decrement: 1 } }
    })
    
    // 如果引用计数为0，删除物理文件和记录
    if (fileHash.refCount <= 0) {
      await cleanupUnusedFile(fileHash)
    }
    
    return fileHash
  } catch (error) {
    console.error('减少引用计数失败:', error)
    throw new Error(`减少引用计数失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 清理未使用的文件
 * @param fileHash FileHash记录
 */
export async function cleanupUnusedFile(fileHash: { id: number; filePath: string; thumbnailPath?: string | null }) {
  try {
    // 删除物理文件
    const fullPath = path.join(process.cwd(), fileHash.filePath)
    try {
      await fs.unlink(fullPath)
      console.log(`已删除物理文件: ${fullPath}`)
    } catch (error) {
      console.warn(`删除物理文件失败: ${fullPath}`, error)
    }
    
    // 删除缩略图
    if (fileHash.thumbnailPath) {
      const thumbnailFullPath = path.join(process.cwd(), fileHash.thumbnailPath)
      try {
        await fs.unlink(thumbnailFullPath)
        console.log(`已删除缩略图: ${thumbnailFullPath}`)
      } catch (error) {
        console.warn(`删除缩略图失败: ${thumbnailFullPath}`, error)
      }
    }
    
    // 删除数据库记录
    await prisma.fileHash.delete({
      where: { id: fileHash.id }
    })
    
    console.log(`已清理FileHash记录: ${fileHash.id}`)
  } catch (error) {
    console.error('清理未使用文件失败:', error)
  }
}

/**
 * 将文件路径转换为访问URL
 * @param filePath 文件路径
 * @returns 访问URL
 */
export function filePathToUrl(filePath: string): string {
  // 移除 'public' 前缀，并确保使用正斜杠
  const urlPath = filePath.replace(/^public[\/\\]/, '').replace(/\\/g, '/')
  return `/${urlPath}`
}

/**
 * 获取去重统计信息
 * @returns 去重统计数据
 */
export async function getDeduplicationStats() {
  try {
    const totalFiles = await prisma.fileHash.count()
    const totalMedia = await prisma.media.count({
      where: { deletedAt: null }
    })
    const totalRefs = await prisma.fileHash.aggregate({
      _sum: { refCount: true }
    })
    
    const spaceSaved = totalRefs._sum.refCount ? totalRefs._sum.refCount - totalFiles : 0
    const deduplicationRate = totalMedia > 0 ? (spaceSaved / totalMedia) * 100 : 0
    
    return {
      totalUniqueFiles: totalFiles,
      totalMediaRecords: totalMedia,
      totalReferences: totalRefs._sum.refCount || 0,
      duplicatesSaved: spaceSaved,
      deduplicationRate: Math.round(deduplicationRate * 100) / 100
    }
  } catch (error) {
    console.error('获取去重统计失败:', error)
    return {
      totalUniqueFiles: 0,
      totalMediaRecords: 0,
      totalReferences: 0,
      duplicatesSaved: 0,
      deduplicationRate: 0
    }
  }
}
