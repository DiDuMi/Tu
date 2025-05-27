#!/usr/bin/env tsx

/**
 * 去重机制测试脚本
 *
 * 此脚本将：
 * 1. 创建测试文件
 * 2. 测试去重上传功能
 * 3. 验证引用计数
 * 4. 测试文件删除
 * 5. 生成测试报告
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { uploadWithDeduplication } from '@/lib/media-upload-dedup'
import { getDeduplicationStats, decrementRefCount } from '@/lib/file-deduplication'

const prisma = new PrismaClient()

interface TestResult {
  name: string
  success: boolean
  message: string
  details?: any
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🧪 开始去重机制测试...')

  const results: TestResult[] = []

  try {
    // 创建测试用户
    const testUser = await createTestUser()
    console.log(`👤 创建测试用户: ${testUser.name} (ID: ${testUser.id})`)

    // 测试1：创建测试文件
    await testCreateTestFiles(results)

    // 测试2：首次上传
    const firstUpload = await testFirstUpload(testUser.id, results)

    // 测试3：重复上传（去重）
    await testDuplicateUpload(testUser.id, results)

    // 测试4：验证引用计数
    await testReferenceCount(results)

    // 测试5：测试文件删除
    if (firstUpload) {
      await testFileDeletion(firstUpload.media.id, results)
    }

    // 测试6：获取统计信息
    await testStatistics(results)

    // 显示测试结果
    displayTestResults(results)

  } catch (error) {
    console.error('❌ 测试失败:', error)
    results.push({
      name: '总体测试',
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    })
  } finally {
    // 清理测试数据
    await cleanupTestData()
    await prisma.$disconnect()
  }
}

/**
 * 创建测试用户
 */
async function createTestUser() {
  const testUser = await prisma.user.upsert({
    where: { email: 'test-dedup@example.com' },
    update: {},
    create: {
      email: 'test-dedup@example.com',
      name: '去重测试用户',
      role: 'USER',
      status: 'ACTIVE'
    }
  })

  return testUser
}

/**
 * 测试1：创建测试文件
 */
async function testCreateTestFiles(results: TestResult[]) {
  try {
    console.log('\n📁 测试1：创建测试文件...')

    const tempDir = path.join(process.cwd(), 'temp-test')
    await fs.mkdir(tempDir, { recursive: true })

    // 创建一个简单的1x1像素PNG图片
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ])

    const testImagePath = path.join(tempDir, 'test-image.png')
    await fs.writeFile(testImagePath, pngHeader)

    // 验证文件创建成功
    const stats = await fs.stat(testImagePath)

    results.push({
      name: '创建测试文件',
      success: true,
      message: `成功创建测试文件，大小: ${stats.size} 字节`,
      details: { path: testImagePath, size: stats.size }
    })

  } catch (error) {
    results.push({
      name: '创建测试文件',
      success: false,
      message: error instanceof Error ? error.message : '创建测试文件失败'
    })
  }
}

/**
 * 测试2：首次上传
 */
async function testFirstUpload(userId: number, results: TestResult[]) {
  try {
    console.log('\n⬆️  测试2：首次上传...')

    const testImagePath = path.join(process.cwd(), 'temp-test', 'test-image.png')

    const result = await uploadWithDeduplication(
      {
        filepath: testImagePath,
        originalFilename: 'test-image.png',
        mimetype: 'image/png',
        size: 67
      },
      userId,
      {
        title: '测试图片',
        description: '用于测试去重功能的图片'
      }
    )

    if (result.success && !result.isDuplicate) {
      results.push({
        name: '首次上传',
        success: true,
        message: '首次上传成功，文件已处理',
        details: { mediaId: result.media?.id, isDuplicate: result.isDuplicate }
      })
      return result
    } else {
      throw new Error(result.error || '首次上传失败')
    }

  } catch (error) {
    results.push({
      name: '首次上传',
      success: false,
      message: error instanceof Error ? error.message : '首次上传失败'
    })
    return null
  }
}

/**
 * 测试3：重复上传（去重）
 */
async function testDuplicateUpload(userId: number, results: TestResult[]) {
  try {
    console.log('\n🔄 测试3：重复上传（去重）...')

    // 重新创建相同内容的文件
    const tempDir = path.join(process.cwd(), 'temp-test')
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ])
    const testImagePath2 = path.join(tempDir, 'test-image-copy.png')
    await fs.writeFile(testImagePath2, pngHeader)

    const result = await uploadWithDeduplication(
      {
        filepath: testImagePath2,
        originalFilename: 'test-image-copy.png',
        mimetype: 'image/png',
        size: 67
      },
      userId,
      {
        title: '测试图片副本',
        description: '相同内容的图片，应该被去重'
      }
    )

    if (result.success && result.isDuplicate) {
      results.push({
        name: '重复上传去重',
        success: true,
        message: `去重成功，节省空间: ${result.spaceSaved} 字节`,
        details: {
          mediaId: result.media?.id,
          isDuplicate: result.isDuplicate,
          spaceSaved: result.spaceSaved
        }
      })
    } else {
      throw new Error(result.error || '去重功能未正常工作')
    }

  } catch (error) {
    results.push({
      name: '重复上传去重',
      success: false,
      message: error instanceof Error ? error.message : '去重测试失败'
    })
  }
}

/**
 * 测试4：验证引用计数
 */
async function testReferenceCount(results: TestResult[]) {
  try {
    console.log('\n🔢 测试4：验证引用计数...')

    const fileHashes = await prisma.fileHash.findMany({
      include: { media: true }
    })

    if (fileHashes.length === 0) {
      throw new Error('没有找到FileHash记录')
    }

    const fileHash = fileHashes[0]
    const expectedRefCount = fileHash.media.filter(m => !m.deletedAt).length

    if (fileHash.refCount === expectedRefCount) {
      results.push({
        name: '引用计数验证',
        success: true,
        message: `引用计数正确: ${fileHash.refCount}`,
        details: {
          fileHashId: fileHash.id,
          refCount: fileHash.refCount,
          mediaCount: expectedRefCount
        }
      })
    } else {
      throw new Error(`引用计数不匹配: 期望 ${expectedRefCount}，实际 ${fileHash.refCount}`)
    }

  } catch (error) {
    results.push({
      name: '引用计数验证',
      success: false,
      message: error instanceof Error ? error.message : '引用计数验证失败'
    })
  }
}

/**
 * 测试5：测试文件删除
 */
async function testFileDeletion(mediaId: number, results: TestResult[]) {
  try {
    console.log('\n🗑️  测试5：测试文件删除...')

    // 获取删除前的FileHash信息
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { fileHash: true }
    })

    if (!media || !media.fileHash) {
      throw new Error('找不到媒体记录或关联的FileHash')
    }

    const initialRefCount = media.fileHash.refCount

    // 软删除媒体记录
    await prisma.media.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() }
    })

    // 减少引用计数
    await decrementRefCount(media.fileHash.id)

    // 验证引用计数是否正确减少
    const updatedFileHash = await prisma.fileHash.findUnique({
      where: { id: media.fileHash.id }
    })

    if (updatedFileHash) {
      const expectedRefCount = initialRefCount - 1
      if (updatedFileHash.refCount === expectedRefCount) {
        results.push({
          name: '文件删除测试',
          success: true,
          message: `删除成功，引用计数从 ${initialRefCount} 减少到 ${updatedFileHash.refCount}`,
          details: {
            mediaId,
            initialRefCount,
            finalRefCount: updatedFileHash.refCount
          }
        })
      } else {
        throw new Error(`引用计数更新错误: 期望 ${expectedRefCount}，实际 ${updatedFileHash.refCount}`)
      }
    } else {
      // FileHash被删除（引用计数为0）
      results.push({
        name: '文件删除测试',
        success: true,
        message: '文件完全删除（引用计数为0）',
        details: { mediaId, fileDeleted: true }
      })
    }

  } catch (error) {
    results.push({
      name: '文件删除测试',
      success: false,
      message: error instanceof Error ? error.message : '文件删除测试失败'
    })
  }
}

/**
 * 测试6：获取统计信息
 */
async function testStatistics(results: TestResult[]) {
  try {
    console.log('\n📊 测试6：获取统计信息...')

    const stats = await getDeduplicationStats()

    results.push({
      name: '统计信息获取',
      success: true,
      message: '成功获取去重统计信息',
      details: stats
    })

  } catch (error) {
    results.push({
      name: '统计信息获取',
      success: false,
      message: error instanceof Error ? error.message : '获取统计信息失败'
    })
  }
}

/**
 * 显示测试结果
 */
function displayTestResults(results: TestResult[]) {
  console.log('\n📋 测试结果汇总:')
  console.log('=' .repeat(60))

  let passedCount = 0
  let failedCount = 0

  results.forEach((result, index) => {
    const status = result.success ? '✅ 通过' : '❌ 失败'
    console.log(`${index + 1}. ${result.name}: ${status}`)
    console.log(`   ${result.message}`)

    if (result.details) {
      console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`)
    }

    if (result.success) {
      passedCount++
    } else {
      failedCount++
    }

    console.log('')
  })

  console.log('=' .repeat(60))
  console.log(`总计: ${results.length} 个测试`)
  console.log(`通过: ${passedCount} 个`)
  console.log(`失败: ${failedCount} 个`)
  console.log(`成功率: ${Math.round((passedCount / results.length) * 100)}%`)
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    console.log('\n🧹 清理测试数据...')

    // 删除测试用户的媒体记录
    await prisma.media.deleteMany({
      where: {
        user: {
          email: 'test-dedup@example.com'
        }
      }
    })

    // 删除测试用户
    await prisma.user.deleteMany({
      where: {
        email: 'test-dedup@example.com'
      }
    })

    // 删除临时文件
    const tempDir = path.join(process.cwd(), 'temp-test')
    try {
      await fs.rmdir(tempDir, { recursive: true })
    } catch (error) {
      console.warn('清理临时目录失败:', error)
    }

    console.log('✅ 测试数据清理完成')

  } catch (error) {
    console.warn('⚠️  清理测试数据时出错:', error)
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error)
}

export { main as runDeduplicationTest }
