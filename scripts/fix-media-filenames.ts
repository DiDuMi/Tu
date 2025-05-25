/**
 * 媒体文件名修复脚本
 * 用于批量修复数据库中包含特殊字符的媒体文件名
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { 
  validateFilename, 
  sanitizeFilename, 
  getSafeMediaUrl,
  batchProcessFilenames 
} from '../lib/filename-utils'

const prisma = new PrismaClient()

interface MediaFile {
  id: number
  uuid: string
  title: string
  url: string
  mimeType: string | null
  type: string
}

interface FixResult {
  success: boolean
  processed: number
  fixed: number
  errors: Array<{
    id: number
    error: string
  }>
  summary: {
    totalFiles: number
    problematicFiles: number
    fixedFiles: number
    failedFiles: number
  }
}

/**
 * 获取所有需要修复的媒体文件
 */
async function getProblematicMediaFiles(): Promise<MediaFile[]> {
  console.log('🔍 正在扫描数据库中的媒体文件...')
  
  const allMedia = await prisma.media.findMany({
    where: {
      deletedAt: null // 只处理未删除的文件
    },
    select: {
      id: true,
      uuid: true,
      title: true,
      url: true,
      mimeType: true,
      type: true
    }
  })

  console.log(`📊 找到 ${allMedia.length} 个媒体文件`)

  // 筛选出有问题的文件
  const problematicFiles = allMedia.filter(media => {
    const filename = path.basename(media.url)
    const validation = validateFilename(filename)
    return !validation.isValid
  })

  console.log(`⚠️  发现 ${problematicFiles.length} 个问题文件`)

  return problematicFiles
}

/**
 * 检查文件是否存在
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * 重命名物理文件
 */
async function renamePhysicalFile(oldPath: string, newPath: string): Promise<boolean> {
  try {
    // 确保目标目录存在
    const targetDir = path.dirname(newPath)
    await fs.mkdir(targetDir, { recursive: true })

    // 重命名文件
    await fs.rename(oldPath, newPath)
    return true
  } catch (error) {
    console.error(`❌ 重命名文件失败: ${oldPath} -> ${newPath}`, error)
    return false
  }
}

/**
 * 修复单个媒体文件
 */
async function fixMediaFile(media: MediaFile): Promise<{
  success: boolean
  oldUrl: string
  newUrl?: string
  error?: string
}> {
  try {
    const oldFilename = path.basename(media.url)
    const validation = validateFilename(oldFilename)

    if (validation.isValid) {
      return { success: true, oldUrl: media.url }
    }

    // 生成新的安全文件名
    const ext = path.extname(oldFilename)
    const timestamp = Date.now()
    const safeBasename = sanitizeFilename(oldFilename)
    const newFilename = `${timestamp}_${safeBasename}`

    // 构建新的URL路径
    const urlDir = path.dirname(media.url)
    const newUrl = `${urlDir}/${newFilename}`.replace(/\\/g, '/')

    // 构建物理文件路径
    const oldPhysicalPath = path.join('public', media.url)
    const newPhysicalPath = path.join('public', newUrl)

    // 检查原文件是否存在
    if (!(await fileExists(oldPhysicalPath))) {
      return {
        success: false,
        oldUrl: media.url,
        error: '原文件不存在'
      }
    }

    // 重命名物理文件
    const renameSuccess = await renamePhysicalFile(oldPhysicalPath, newPhysicalPath)
    if (!renameSuccess) {
      return {
        success: false,
        oldUrl: media.url,
        error: '物理文件重命名失败'
      }
    }

    // 更新数据库记录
    await prisma.media.update({
      where: { id: media.id },
      data: {
        url: newUrl,
        title: media.title.replace(/[^\w\s\-._]/g, '_') // 同时清理标题
      }
    })

    console.log(`✅ 修复成功: ${media.uuid}`)
    console.log(`   旧路径: ${media.url}`)
    console.log(`   新路径: ${newUrl}`)

    return {
      success: true,
      oldUrl: media.url,
      newUrl: newUrl
    }

  } catch (error) {
    console.error(`❌ 修复失败: ${media.uuid}`, error)
    return {
      success: false,
      oldUrl: media.url,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 生成修复报告
 */
function generateReport(results: FixResult): string {
  const { summary, errors } = results

  let report = `
# 媒体文件名修复报告

## 📊 统计信息
- 总文件数: ${summary.totalFiles}
- 问题文件数: ${summary.problematicFiles}
- 修复成功: ${summary.fixedFiles}
- 修复失败: ${summary.failedFiles}
- 成功率: ${((summary.fixedFiles / summary.problematicFiles) * 100).toFixed(2)}%

## 📋 处理详情
`

  if (errors.length > 0) {
    report += `
### ❌ 修复失败的文件
| ID | 错误信息 |
|----|----------|
`
    errors.forEach(error => {
      report += `| ${error.id} | ${error.error} |\n`
    })
  }

  report += `
## 🔧 建议
1. 对于修复失败的文件，请手动检查文件是否存在
2. 建议在上传组件中添加文件名验证
3. 定期运行此脚本检查新的问题文件

---
生成时间: ${new Date().toLocaleString()}
`

  return report
}

/**
 * 主修复函数
 */
async function fixMediaFilenames(dryRun: boolean = false): Promise<FixResult> {
  console.log('🚀 开始媒体文件名修复流程...')
  
  if (dryRun) {
    console.log('🔍 运行模式: 预览模式（不会实际修改文件）')
  }

  const problematicFiles = await getProblematicMediaFiles()
  
  if (problematicFiles.length === 0) {
    console.log('🎉 没有发现需要修复的文件！')
    return {
      success: true,
      processed: 0,
      fixed: 0,
      errors: [],
      summary: {
        totalFiles: 0,
        problematicFiles: 0,
        fixedFiles: 0,
        failedFiles: 0
      }
    }
  }

  // 显示问题文件预览
  console.log('\n📋 问题文件预览:')
  problematicFiles.slice(0, 5).forEach(file => {
    const filename = path.basename(file.url)
    const validation = validateFilename(filename)
    console.log(`  - ${file.uuid}: ${filename}`)
    console.log(`    问题: ${validation.issues.join(', ')}`)
  })

  if (problematicFiles.length > 5) {
    console.log(`  ... 还有 ${problematicFiles.length - 5} 个文件`)
  }

  if (dryRun) {
    console.log('\n🔍 预览模式完成，未进行实际修复')
    return {
      success: true,
      processed: problematicFiles.length,
      fixed: 0,
      errors: [],
      summary: {
        totalFiles: problematicFiles.length,
        problematicFiles: problematicFiles.length,
        fixedFiles: 0,
        failedFiles: 0
      }
    }
  }

  // 确认是否继续
  console.log(`\n⚠️  即将修复 ${problematicFiles.length} 个文件`)
  console.log('此操作将重命名物理文件并更新数据库记录')
  
  // 在实际脚本中，这里应该有用户确认逻辑
  // 为了演示，我们假设用户确认继续

  console.log('\n🔧 开始修复文件...')

  const results: FixResult = {
    success: true,
    processed: 0,
    fixed: 0,
    errors: [],
    summary: {
      totalFiles: problematicFiles.length,
      problematicFiles: problematicFiles.length,
      fixedFiles: 0,
      failedFiles: 0
    }
  }

  // 逐个修复文件
  for (const file of problematicFiles) {
    results.processed++
    
    const fixResult = await fixMediaFile(file)
    
    if (fixResult.success) {
      results.fixed++
      results.summary.fixedFiles++
    } else {
      results.errors.push({
        id: file.id,
        error: fixResult.error || '未知错误'
      })
      results.summary.failedFiles++
    }

    // 显示进度
    const progress = ((results.processed / problematicFiles.length) * 100).toFixed(1)
    console.log(`📈 进度: ${progress}% (${results.processed}/${problematicFiles.length})`)
  }

  console.log('\n✅ 修复完成！')
  console.log(`📊 成功: ${results.fixed}, 失败: ${results.errors.length}`)

  return results
}

/**
 * 脚本入口点
 */
async function main() {
  try {
    // 检查命令行参数
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run') || args.includes('-d')
    const generateReportFlag = args.includes('--report') || args.includes('-r')

    console.log('🎬 媒体文件名修复工具')
    console.log('========================')

    const results = await fixMediaFilenames(dryRun)

    if (generateReportFlag) {
      const report = generateReport(results)
      const reportPath = `media-fix-report-${Date.now()}.md`
      await fs.writeFile(reportPath, report)
      console.log(`📄 报告已生成: ${reportPath}`)
    }

    console.log('\n🎉 脚本执行完成！')

  } catch (error) {
    console.error('💥 脚本执行失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { fixMediaFilenames, getProblematicMediaFiles }
