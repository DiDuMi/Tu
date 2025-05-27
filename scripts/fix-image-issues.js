#!/usr/bin/env node

/**
 * 图片问题快速修复脚本
 * 解决当前项目中的图片加载问题
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 开始修复图片相关问题...\n')

// 1. 创建缺失的占位图片
function createPlaceholderImages() {
  console.log('📁 创建占位图片...')
  
  const placeholderDir = path.join(process.cwd(), 'public', 'images')
  
  // 确保目录存在
  if (!fs.existsSync(placeholderDir)) {
    fs.mkdirSync(placeholderDir, { recursive: true })
    console.log('✅ 创建 /public/images 目录')
  }
  
  // 创建占位图片的SVG
  const placeholderSvg = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
    图片加载中...
  </text>
</svg>`.trim()

  const avatarSvg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="#e5e7eb"/>
  <circle cx="100" cy="80" r="30" fill="#9ca3af"/>
  <ellipse cx="100" cy="140" rx="40" ry="30" fill="#9ca3af"/>
</svg>`.trim()

  const logoSvg = `
<svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#3b82f6"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="white" font-weight="bold">
    兔图
  </text>
</svg>`.trim()

  // 写入文件
  const files = [
    { name: 'placeholder.svg', content: placeholderSvg },
    { name: 'avatar-placeholder.svg', content: avatarSvg },
    { name: 'logo-placeholder.svg', content: logoSvg }
  ]

  files.forEach(file => {
    const filePath = path.join(placeholderDir, file.name)
    fs.writeFileSync(filePath, file.content)
    console.log(`✅ 创建 ${file.name}`)
  })
}

// 2. 更新Next.js配置以处理图片超时
function updateNextConfig() {
  console.log('\n⚙️ 更新Next.js配置...')
  
  const configPath = path.join(process.cwd(), 'next.config.js')
  
  if (fs.existsSync(configPath)) {
    let config = fs.readFileSync(configPath, 'utf8')
    
    // 检查是否已有图片超时配置
    if (!config.includes('minimumCacheTTL')) {
      // 在images配置中添加超时设置
      config = config.replace(
        /images:\s*{([^}]+)}/,
        `images: {$1,
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', '127.0.0.1'],
    unoptimized: process.env.NODE_ENV === 'development'
  }`
      )
      
      fs.writeFileSync(configPath, config)
      console.log('✅ 更新 next.config.js')
    } else {
      console.log('ℹ️ Next.js配置已是最新')
    }
  }
}

// 3. 创建图片错误处理工具
function createImageErrorHandler() {
  console.log('\n🛠️ 创建图片错误处理工具...')
  
  const utilsDir = path.join(process.cwd(), 'lib')
  const handlerPath = path.join(utilsDir, 'image-error-handler.ts')
  
  const handlerContent = `
/**
 * 图片错误处理工具
 * 统一处理图片加载失败的情况
 */

export interface ImageErrorConfig {
  fallbackImage?: string
  retryCount?: number
  retryDelay?: number
  onError?: (src: string, error: Error) => void
}

export const DEFAULT_CONFIG: ImageErrorConfig = {
  fallbackImage: '/images/placeholder.svg',
  retryCount: 2,
  retryDelay: 1000,
  onError: (src, error) => {
    console.warn(\`图片加载失败: \${src}\`, error)
  }
}

/**
 * 图片URL验证
 */
export function validateImageUrl(src: string): boolean {
  if (!src) return false
  
  // 检查是否是有效的URL格式
  try {
    if (src.startsWith('/')) return true // 相对路径
    if (src.startsWith('data:')) return true // base64
    new URL(src) // 绝对URL验证
    return true
  } catch {
    return false
  }
}

/**
 * 获取安全的图片URL
 */
export function getSafeImageUrl(src: string, fallback?: string): string {
  if (validateImageUrl(src)) return src
  return fallback || DEFAULT_CONFIG.fallbackImage || '/images/placeholder.svg'
}

/**
 * 图片预加载
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(\`Failed to preload: \${src}\`))
    img.src = src
  })
}

/**
 * 批量图片预加载
 */
export async function preloadImages(sources: string[]): Promise<void> {
  const validSources = sources.filter(validateImageUrl)
  
  try {
    await Promise.allSettled(
      validSources.map(src => preloadImage(src))
    )
  } catch (error) {
    console.warn('部分图片预加载失败', error)
  }
}

export default {
  validateImageUrl,
  getSafeImageUrl,
  preloadImage,
  preloadImages,
  DEFAULT_CONFIG
}
`.trim()

  fs.writeFileSync(handlerPath, handlerContent)
  console.log('✅ 创建 image-error-handler.ts')
}

// 4. 创建图片性能监控工具
function createPerformanceMonitor() {
  console.log('\n📊 创建性能监控工具...')
  
  const hooksDir = path.join(process.cwd(), 'hooks')
  const monitorPath = path.join(hooksDir, 'useImagePerformance.ts')
  
  const monitorContent = `
import { useState, useEffect, useCallback } from 'react'

interface ImageMetrics {
  loadTime: number
  fileSize?: number
  format?: string
  cached: boolean
  error?: string
}

interface PerformanceData {
  totalImages: number
  averageLoadTime: number
  successRate: number
  cacheHitRate: number
  metrics: Map<string, ImageMetrics>
}

/**
 * 图片性能监控Hook
 */
export function useImagePerformance() {
  const [data, setData] = useState<PerformanceData>({
    totalImages: 0,
    averageLoadTime: 0,
    successRate: 0,
    cacheHitRate: 0,
    metrics: new Map()
  })

  const recordMetric = useCallback((src: string, metric: ImageMetrics) => {
    setData(prev => {
      const newMetrics = new Map(prev.metrics)
      newMetrics.set(src, metric)
      
      const totalImages = newMetrics.size
      const loadTimes = Array.from(newMetrics.values()).map(m => m.loadTime)
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      const successCount = Array.from(newMetrics.values()).filter(m => !m.error).length
      const successRate = (successCount / totalImages) * 100
      const cacheCount = Array.from(newMetrics.values()).filter(m => m.cached).length
      const cacheHitRate = (cacheCount / totalImages) * 100
      
      return {
        totalImages,
        averageLoadTime,
        successRate,
        cacheHitRate,
        metrics: newMetrics
      }
    })
  }, [])

  const startTiming = useCallback((src: string) => {
    const startTime = performance.now()
    
    return {
      onLoad: () => {
        const loadTime = performance.now() - startTime
        recordMetric(src, {
          loadTime,
          cached: loadTime < 50, // 假设小于50ms为缓存命中
        })
      },
      onError: (error: string) => {
        const loadTime = performance.now() - startTime
        recordMetric(src, {
          loadTime,
          cached: false,
          error
        })
      }
    }
  }, [recordMetric])

  return {
    data,
    startTiming,
    recordMetric
  }
}

export default useImagePerformance
`.trim()

  fs.writeFileSync(monitorPath, monitorContent)
  console.log('✅ 创建 useImagePerformance.ts')
}

// 5. 检查并修复缺失的上传目录
function checkUploadDirectories() {
  console.log('\n📂 检查上传目录...')
  
  const uploadDirs = [
    'public/uploads',
    'public/uploads/media',
    'public/uploads/avatars',
    'public/uploads/covers'
  ]
  
  uploadDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`✅ 创建目录: ${dir}`)
    } else {
      console.log(`ℹ️ 目录已存在: ${dir}`)
    }
  })
}

// 6. 生成修复报告
function generateReport() {
  console.log('\n📋 生成修复报告...')
  
  const report = `
# 图片问题修复报告

## 修复时间
${new Date().toLocaleString('zh-CN')}

## 已修复的问题
✅ 创建了占位图片文件
✅ 更新了Next.js配置
✅ 创建了图片错误处理工具
✅ 创建了性能监控工具
✅ 检查并创建了上传目录

## 下一步建议
1. 重启开发服务器以应用配置更改
2. 测试图片加载功能
3. 检查性能监控数据
4. 根据需要调整配置

## 使用方法

### 错误处理
\`\`\`typescript
import { getSafeImageUrl } from '@/lib/image-error-handler'

const safeUrl = getSafeImageUrl(originalUrl, '/images/placeholder.svg')
\`\`\`

### 性能监控
\`\`\`typescript
import { useImagePerformance } from '@/hooks/useImagePerformance'

const { data, startTiming } = useImagePerformance()
const { onLoad, onError } = startTiming(imageUrl)
\`\`\`

## 注意事项
- 重启服务器后配置才会生效
- 建议在生产环境中启用图片CDN
- 定期检查性能监控数据
`.trim()

  const reportPath = path.join(process.cwd(), 'docs', 'image-fix-report.md')
  fs.writeFileSync(reportPath, report)
  console.log('✅ 生成修复报告: docs/image-fix-report.md')
}

// 执行所有修复步骤
async function main() {
  try {
    createPlaceholderImages()
    updateNextConfig()
    createImageErrorHandler()
    createPerformanceMonitor()
    checkUploadDirectories()
    generateReport()
    
    console.log('\n🎉 所有修复完成！')
    console.log('\n📝 下一步操作:')
    console.log('1. 重启开发服务器: npm run dev')
    console.log('2. 测试图片功能: http://localhost:3000/test/simple-image-test')
    console.log('3. 查看修复报告: docs/image-fix-report.md')
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error)
    process.exit(1)
  }
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = {
  createPlaceholderImages,
  updateNextConfig,
  createImageErrorHandler,
  createPerformanceMonitor,
  checkUploadDirectories,
  generateReport
}
