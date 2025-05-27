#!/usr/bin/env node

/**
 * 视频上传优化脚本
 * 帮助用户了解和优化视频文件以便上传
 */

const fs = require('fs')
const path = require('path')

console.log('🎬 视频上传优化工具\n')

// 当前配置的文件大小限制
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const RECOMMENDED_SIZE = 100 * 1024 * 1024 // 100MB (推荐大小)

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 检查文件大小
 */
function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    const fileSize = stats.size
    
    console.log(`📁 文件: ${path.basename(filePath)}`)
    console.log(`📏 大小: ${formatFileSize(fileSize)}`)
    
    if (fileSize > MAX_FILE_SIZE) {
      console.log(`❌ 文件过大! 超出限制 ${formatFileSize(MAX_FILE_SIZE - fileSize)}`)
      console.log(`💡 建议: 压缩视频或降低质量`)
      return false
    } else if (fileSize > RECOMMENDED_SIZE) {
      console.log(`⚠️  文件较大，建议压缩以提高上传速度`)
      console.log(`💡 推荐大小: ${formatFileSize(RECOMMENDED_SIZE)}`)
      return true
    } else {
      console.log(`✅ 文件大小合适`)
      return true
    }
  } catch (error) {
    console.error(`❌ 无法读取文件: ${error.message}`)
    return false
  }
}

/**
 * 获取视频压缩建议
 */
function getCompressionAdvice(fileSize) {
  const compressionRatio = fileSize / RECOMMENDED_SIZE
  
  if (compressionRatio > 5) {
    return {
      quality: 'low',
      crf: 28,
      resolution: '720p',
      bitrate: '1M',
      advice: '大幅压缩 - 降低分辨率到720p，使用较低质量'
    }
  } else if (compressionRatio > 2) {
    return {
      quality: 'medium',
      crf: 23,
      resolution: '1080p',
      bitrate: '2M',
      advice: '中等压缩 - 保持1080p，适度降低质量'
    }
  } else {
    return {
      quality: 'high',
      crf: 18,
      resolution: '1080p',
      bitrate: '4M',
      advice: '轻微压缩 - 保持高质量，轻微优化'
    }
  }
}

/**
 * 生成FFmpeg压缩命令
 */
function generateFFmpegCommand(inputFile, advice) {
  const outputFile = inputFile.replace(/\.[^.]+$/, '_compressed.mp4')
  
  return `ffmpeg -i "${inputFile}" \\
  -c:v libx264 \\
  -crf ${advice.crf} \\
  -preset medium \\
  -c:a aac \\
  -b:a 128k \\
  -movflags +faststart \\
  "${outputFile}"`
}

/**
 * 显示支持的格式
 */
function showSupportedFormats() {
  console.log('📋 支持的视频格式:')
  console.log('  • MP4 (推荐)')
  console.log('  • WebM')
  console.log('  • AVI')
  console.log('  • MOV')
  console.log('  • WMV')
  console.log('  • FLV')
  console.log('  • 3GP')
  console.log('')
}

/**
 * 显示上传限制信息
 */
function showUploadLimits() {
  console.log('📊 上传限制信息:')
  console.log(`  • 最大文件大小: ${formatFileSize(MAX_FILE_SIZE)}`)
  console.log(`  • 推荐文件大小: ${formatFileSize(RECOMMENDED_SIZE)}`)
  console.log(`  • 支持格式: MP4, WebM, AVI, MOV, WMV, FLV, 3GP`)
  console.log('')
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('使用方法:')
    console.log('  node video-upload-optimizer.js <视频文件路径>')
    console.log('  node video-upload-optimizer.js --info')
    console.log('')
    showUploadLimits()
    showSupportedFormats()
    return
  }
  
  if (args[0] === '--info') {
    showUploadLimits()
    showSupportedFormats()
    
    console.log('💡 优化建议:')
    console.log('  1. 使用MP4格式以获得最佳兼容性')
    console.log('  2. 分辨率建议: 1080p或720p')
    console.log('  3. 比特率建议: 1-4Mbps')
    console.log('  4. 使用H.264编码器')
    console.log('  5. 启用快速启动(faststart)优化网络播放')
    console.log('')
    
    console.log('🛠️ 压缩工具推荐:')
    console.log('  • FFmpeg (命令行)')
    console.log('  • HandBrake (图形界面)')
    console.log('  • Adobe Media Encoder')
    console.log('  • DaVinci Resolve (免费)')
    console.log('')
    return
  }
  
  const filePath = args[0]
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    return
  }
  
  console.log('🔍 分析视频文件...\n')
  
  const isValid = checkFileSize(filePath)
  
  if (!isValid) {
    console.log('\n🛠️ 压缩建议:')
    
    try {
      const stats = fs.statSync(filePath)
      const advice = getCompressionAdvice(stats.size)
      
      console.log(`  • 建议质量: ${advice.quality}`)
      console.log(`  • 建议分辨率: ${advice.resolution}`)
      console.log(`  • 建议比特率: ${advice.bitrate}`)
      console.log(`  • ${advice.advice}`)
      console.log('')
      
      console.log('🔧 FFmpeg压缩命令:')
      console.log(generateFFmpegCommand(filePath, advice))
      console.log('')
      
    } catch (error) {
      console.error(`❌ 分析文件失败: ${error.message}`)
    }
  }
  
  console.log('📚 更多帮助:')
  console.log('  • 运行 "node video-upload-optimizer.js --info" 查看详细信息')
  console.log('  • 访问项目文档了解更多优化技巧')
  console.log('')
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = {
  checkFileSize,
  getCompressionAdvice,
  generateFFmpegCommand,
  formatFileSize,
  MAX_FILE_SIZE,
  RECOMMENDED_SIZE
}
