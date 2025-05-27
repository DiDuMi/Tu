#!/usr/bin/env tsx

/**
 * 媒体文件去重机制迁移脚本
 * 
 * 此脚本将：
 * 1. 清理现有媒体数据（开发环境）
 * 2. 重置数据库到新的去重模式
 * 3. 创建必要的目录结构
 * 4. 验证迁移结果
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface MigrationStats {
  mediaRecordsDeleted: number
  filesDeleted: number
  directoriesCreated: string[]
  errors: string[]
}

/**
 * 主迁移函数
 */
async function main() {
  console.log('🚀 开始媒体文件去重机制迁移...')
  console.log('⚠️  警告：此操作将删除所有现有媒体数据！')
  
  const stats: MigrationStats = {
    mediaRecordsDeleted: 0,
    filesDeleted: 0,
    directoriesCreated: [],
    errors: []
  }
  
  try {
    // 步骤1：清理现有媒体数据
    await cleanupExistingMedia(stats)
    
    // 步骤2：创建新的目录结构
    await createDirectoryStructure(stats)
    
    // 步骤3：验证数据库模式
    await verifyDatabaseSchema()
    
    // 步骤4：显示迁移结果
    displayMigrationResults(stats)
    
    console.log('✅ 迁移完成！')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    stats.errors.push(error instanceof Error ? error.message : '未知错误')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 清理现有媒体数据
 */
async function cleanupExistingMedia(stats: MigrationStats) {
  console.log('\n📋 步骤1：清理现有媒体数据...')
  
  try {
    // 获取现有媒体记录数量
    const mediaCount = await prisma.media.count()
    console.log(`📊 发现 ${mediaCount} 条媒体记录`)
    
    if (mediaCount > 0) {
      // 删除媒体相关的关联数据
      console.log('🗑️  删除媒体版本记录...')
      await prisma.mediaVersion.deleteMany({})
      
      console.log('🗑️  删除媒体标签关联...')
      await prisma.$executeRaw`DELETE FROM _MediaToMediaTag`
      
      console.log('🗑️  删除媒体记录...')
      await prisma.media.deleteMany({})
      
      stats.mediaRecordsDeleted = mediaCount
    }
    
    // 清理现有上传目录
    await cleanupUploadDirectory(stats)
    
    console.log('✅ 媒体数据清理完成')
    
  } catch (error) {
    console.error('❌ 清理媒体数据失败:', error)
    throw error
  }
}

/**
 * 清理上传目录
 */
async function cleanupUploadDirectory(stats: MigrationStats) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  
  try {
    const exists = await fs.access(uploadDir).then(() => true).catch(() => false)
    
    if (exists) {
      console.log('🗑️  清理现有上传目录...')
      
      // 递归删除上传目录中的所有文件
      const files = await getFilesRecursively(uploadDir)
      
      for (const file of files) {
        try {
          await fs.unlink(file)
          stats.filesDeleted++
        } catch (error) {
          console.warn(`⚠️  删除文件失败: ${file}`, error)
          stats.errors.push(`删除文件失败: ${file}`)
        }
      }
      
      // 删除空目录
      try {
        await fs.rmdir(uploadDir, { recursive: true })
      } catch (error) {
        console.warn('⚠️  删除上传目录失败:', error)
      }
    }
    
  } catch (error) {
    console.warn('⚠️  清理上传目录时出错:', error)
    stats.errors.push(`清理上传目录失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 递归获取目录中的所有文件
 */
async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = []
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        const subFiles = await getFilesRecursively(fullPath)
        files.push(...subFiles)
      } else {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.warn(`读取目录失败: ${dir}`, error)
  }
  
  return files
}

/**
 * 创建新的目录结构
 */
async function createDirectoryStructure(stats: MigrationStats) {
  console.log('\n📁 步骤2：创建新的目录结构...')
  
  const directories = [
    'public/uploads/media/hashes',
    'public/uploads/media/thumbnails',
    'public/uploads/media/temp'
  ]
  
  // 创建哈希前缀目录 (00-ff)
  for (let i = 0; i < 256; i++) {
    const prefix = i.toString(16).padStart(2, '0')
    directories.push(`public/uploads/media/hashes/${prefix}`)
    directories.push(`public/uploads/media/thumbnails/${prefix}`)
    
    // 创建二级前缀目录 (00-ff)
    for (let j = 0; j < 256; j++) {
      const prefix2 = j.toString(16).padStart(2, '0')
      directories.push(`public/uploads/media/hashes/${prefix}/${prefix2}`)
      directories.push(`public/uploads/media/thumbnails/${prefix}/${prefix2}`)
    }
  }
  
  for (const dir of directories) {
    try {
      const fullPath = path.join(process.cwd(), dir)
      await fs.mkdir(fullPath, { recursive: true })
      stats.directoriesCreated.push(dir)
    } catch (error) {
      console.warn(`⚠️  创建目录失败: ${dir}`, error)
      stats.errors.push(`创建目录失败: ${dir}`)
    }
  }
  
  console.log(`✅ 创建了 ${stats.directoriesCreated.length} 个目录`)
}

/**
 * 验证数据库模式
 */
async function verifyDatabaseSchema() {
  console.log('\n🔍 步骤3：验证数据库模式...')
  
  try {
    // 检查FileHash表是否存在
    const fileHashExists = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='FileHash'
    `
    
    if (!Array.isArray(fileHashExists) || fileHashExists.length === 0) {
      throw new Error('FileHash表不存在，请先运行 npx prisma db push')
    }
    
    // 检查Media表是否有fileHashId字段
    const mediaSchema = await prisma.$queryRaw`
      PRAGMA table_info(Media)
    `
    
    const hasFileHashId = Array.isArray(mediaSchema) && 
      mediaSchema.some((col: any) => col.name === 'fileHashId')
    
    if (!hasFileHashId) {
      throw new Error('Media表缺少fileHashId字段，请先运行 npx prisma db push')
    }
    
    console.log('✅ 数据库模式验证通过')
    
  } catch (error) {
    console.error('❌ 数据库模式验证失败:', error)
    throw error
  }
}

/**
 * 显示迁移结果
 */
function displayMigrationResults(stats: MigrationStats) {
  console.log('\n📊 迁移结果统计:')
  console.log(`📝 删除媒体记录: ${stats.mediaRecordsDeleted} 条`)
  console.log(`🗑️  删除文件: ${stats.filesDeleted} 个`)
  console.log(`📁 创建目录: ${stats.directoriesCreated.length} 个`)
  
  if (stats.errors.length > 0) {
    console.log(`⚠️  错误数量: ${stats.errors.length}`)
    stats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }
}

// 运行迁移
if (require.main === module) {
  main().catch(console.error)
}

export { main as runMigration }
