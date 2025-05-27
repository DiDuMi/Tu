#!/usr/bin/env tsx

/**
 * 测试去重上传API
 * 
 * 此脚本将：
 * 1. 创建测试用户
 * 2. 创建测试图片文件
 * 3. 测试首次上传
 * 4. 测试重复上传（去重）
 * 5. 验证API响应
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'

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
  console.log('🧪 开始测试去重上传API...')
  
  const results: TestResult[] = []
  
  try {
    // 创建测试用户
    const testUser = await createTestUser()
    console.log(`👤 创建测试用户: ${testUser.name} (ID: ${testUser.id})`)
    
    // 创建测试文件
    const testImagePath = await createTestImage()
    console.log(`📁 创建测试文件: ${testImagePath}`)
    
    // 测试1：首次上传
    const firstUpload = await testFirstUpload(testImagePath, results)
    
    // 测试2：重复上传（去重）
    await testDuplicateUpload(testImagePath, results)
    
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
    where: { email: 'test-upload-api@example.com' },
    update: {},
    create: {
      email: 'test-upload-api@example.com',
      name: 'API测试用户',
      role: 'USER',
      status: 'ACTIVE'
    }
  })
  
  return testUser
}

/**
 * 创建测试图片文件
 */
async function createTestImage(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp-api-test')
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
  
  const testImagePath = path.join(tempDir, 'test-api-image.png')
  await fs.writeFile(testImagePath, pngHeader)
  
  return testImagePath
}

/**
 * 测试首次上传
 */
async function testFirstUpload(imagePath: string, results: TestResult[]) {
  try {
    console.log('\n⬆️  测试1：首次上传...')
    
    const formData = new FormData()
    formData.append('file', await fs.readFile(imagePath), {
      filename: 'test-api-image.png',
      contentType: 'image/png'
    })
    formData.append('title', 'API测试图片')
    formData.append('description', '用于测试去重API的图片')
    
    const response = await fetch('http://localhost:3000/api/v1/media/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // 简化的认证
      }
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      results.push({
        name: '首次上传',
        success: true,
        message: '首次上传成功',
        details: {
          mediaId: result.data.id,
          isDuplicate: result.data.isDuplicate,
          fileSize: result.data.fileSize
        }
      })
      return result.data
    } else {
      throw new Error(result.error?.message || '首次上传失败')
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
 * 测试重复上传（去重）
 */
async function testDuplicateUpload(imagePath: string, results: TestResult[]) {
  try {
    console.log('\n🔄 测试2：重复上传（去重）...')
    
    const formData = new FormData()
    formData.append('file', await fs.readFile(imagePath), {
      filename: 'test-api-image-copy.png',
      contentType: 'image/png'
    })
    formData.append('title', 'API测试图片副本')
    formData.append('description', '相同内容的图片，应该被去重')
    
    const response = await fetch('http://localhost:3000/api/v1/media/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // 简化的认证
      }
    })
    
    const result = await response.json()
    
    if (response.ok && result.success && result.data.isDuplicate) {
      results.push({
        name: '重复上传去重',
        success: true,
        message: `去重成功，节省空间: ${result.data.spaceSaved} 字节`,
        details: {
          mediaId: result.data.id,
          isDuplicate: result.data.isDuplicate,
          spaceSaved: result.data.spaceSaved
        }
      })
    } else {
      throw new Error(result.error?.message || '去重功能未正常工作')
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
 * 显示测试结果
 */
function displayTestResults(results: TestResult[]) {
  console.log('\n📋 API测试结果汇总:')
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
          email: 'test-upload-api@example.com'
        }
      }
    })
    
    // 删除测试用户
    await prisma.user.deleteMany({
      where: {
        email: 'test-upload-api@example.com'
      }
    })
    
    // 删除临时文件
    const tempDir = path.join(process.cwd(), 'temp-api-test')
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

export { main as runUploadApiTest }
