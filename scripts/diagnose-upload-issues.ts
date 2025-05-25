/**
 * 上传问题诊断脚本
 * 快速检查可能导致上传失败的问题
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DiagnosisResult {
  category: string
  status: 'OK' | 'WARNING' | 'ERROR'
  message: string
  details?: any
}

/**
 * 检查文件系统权限
 */
async function checkFileSystemPermissions(): Promise<DiagnosisResult[]> {
  const results: DiagnosisResult[] = []
  
  try {
    // 检查uploads目录
    const uploadsDir = path.join('public', 'uploads')
    
    try {
      await fs.access(uploadsDir)
      results.push({
        category: '文件系统',
        status: 'OK',
        message: 'uploads目录存在'
      })
    } catch {
      try {
        await fs.mkdir(uploadsDir, { recursive: true })
        results.push({
          category: '文件系统',
          status: 'WARNING',
          message: 'uploads目录不存在，已自动创建'
        })
      } catch (error) {
        results.push({
          category: '文件系统',
          status: 'ERROR',
          message: '无法创建uploads目录',
          details: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    // 检查媒体目录
    const mediaDir = path.join('public', 'uploads', 'media')
    try {
      await fs.access(mediaDir)
      results.push({
        category: '文件系统',
        status: 'OK',
        message: 'media目录存在'
      })
    } catch {
      try {
        await fs.mkdir(mediaDir, { recursive: true })
        results.push({
          category: '文件系统',
          status: 'WARNING',
          message: 'media目录不存在，已自动创建'
        })
      } catch (error) {
        results.push({
          category: '文件系统',
          status: 'ERROR',
          message: '无法创建media目录',
          details: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    // 检查写入权限
    const testFile = path.join(mediaDir, 'test-write.txt')
    try {
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)
      results.push({
        category: '文件系统',
        status: 'OK',
        message: '目录写入权限正常'
      })
    } catch (error) {
      results.push({
        category: '文件系统',
        status: 'ERROR',
        message: '目录写入权限不足',
        details: error instanceof Error ? error.message : '未知错误'
      })
    }

  } catch (error) {
    results.push({
      category: '文件系统',
      status: 'ERROR',
      message: '文件系统检查失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }

  return results
}

/**
 * 检查数据库连接
 */
async function checkDatabaseConnection(): Promise<DiagnosisResult[]> {
  const results: DiagnosisResult[] = []

  try {
    // 测试数据库连接
    await prisma.$connect()
    results.push({
      category: '数据库',
      status: 'OK',
      message: '数据库连接正常'
    })

    // 检查必要的表
    const tables = ['User', 'Media', 'MediaCategory', 'MediaTag']
    for (const table of tables) {
      try {
        // 尝试查询表
        await (prisma as any)[table.toLowerCase()].findFirst()
        results.push({
          category: '数据库',
          status: 'OK',
          message: `${table}表存在且可访问`
        })
      } catch (error) {
        results.push({
          category: '数据库',
          status: 'ERROR',
          message: `${table}表不存在或无法访问`,
          details: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

  } catch (error) {
    results.push({
      category: '数据库',
      status: 'ERROR',
      message: '数据库连接失败',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }

  return results
}

/**
 * 检查环境变量
 */
async function checkEnvironmentVariables(): Promise<DiagnosisResult[]> {
  const results: DiagnosisResult[] = []

  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      results.push({
        category: '环境变量',
        status: 'OK',
        message: `${envVar} 已设置`
      })
    } else {
      results.push({
        category: '环境变量',
        status: 'ERROR',
        message: `${envVar} 未设置`
      })
    }
  }

  return results
}

/**
 * 检查依赖包
 */
async function checkDependencies(): Promise<DiagnosisResult[]> {
  const results: DiagnosisResult[] = []

  const requiredPackages = [
    'formidable',
    'sharp',
    '@prisma/client',
    'next-auth'
  ]

  try {
    const packageJson = JSON.parse(
      await fs.readFile('package.json', 'utf-8')
    )

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    for (const pkg of requiredPackages) {
      if (allDeps[pkg]) {
        results.push({
          category: '依赖包',
          status: 'OK',
          message: `${pkg} 已安装 (${allDeps[pkg]})`
        })
      } else {
        results.push({
          category: '依赖包',
          status: 'ERROR',
          message: `${pkg} 未安装`
        })
      }
    }

    // 检查关键包是否可以正常导入
    try {
      require('formidable')
      results.push({
        category: '依赖包',
        status: 'OK',
        message: 'formidable 可以正常导入'
      })
    } catch (error) {
      results.push({
        category: '依赖包',
        status: 'ERROR',
        message: 'formidable 导入失败',
        details: error instanceof Error ? error.message : '未知错误'
      })
    }

    try {
      require('sharp')
      results.push({
        category: '依赖包',
        status: 'OK',
        message: 'sharp 可以正常导入'
      })
    } catch (error) {
      results.push({
        category: '依赖包',
        status: 'WARNING',
        message: 'sharp 导入失败（图片处理将不可用）',
        details: error instanceof Error ? error.message : '未知错误'
      })
    }

  } catch (error) {
    results.push({
      category: '依赖包',
      status: 'ERROR',
      message: '无法读取package.json',
      details: error instanceof Error ? error.message : '未知错误'
    })
  }

  return results
}

/**
 * 检查API路由
 */
async function checkAPIRoutes(): Promise<DiagnosisResult[]> {
  const results: DiagnosisResult[] = []

  const apiRoutes = [
    'pages/api/v1/media/upload.ts',
    'pages/api/v1/media/debug-upload.ts',
    'pages/api/auth/[...nextauth].ts'
  ]

  for (const route of apiRoutes) {
    try {
      await fs.access(route)
      results.push({
        category: 'API路由',
        status: 'OK',
        message: `${route} 存在`
      })
    } catch {
      results.push({
        category: 'API路由',
        status: 'ERROR',
        message: `${route} 不存在`
      })
    }
  }

  return results
}

/**
 * 生成诊断报告
 */
function generateReport(allResults: DiagnosisResult[]): string {
  const categories = [...new Set(allResults.map(r => r.category))]
  
  let report = `
# 上传功能诊断报告

生成时间: ${new Date().toLocaleString()}

## 📊 总体状态

`

  const statusCounts = {
    OK: allResults.filter(r => r.status === 'OK').length,
    WARNING: allResults.filter(r => r.status === 'WARNING').length,
    ERROR: allResults.filter(r => r.status === 'ERROR').length
  }

  report += `- ✅ 正常: ${statusCounts.OK}\n`
  report += `- ⚠️ 警告: ${statusCounts.WARNING}\n`
  report += `- ❌ 错误: ${statusCounts.ERROR}\n\n`

  // 按类别分组显示结果
  for (const category of categories) {
    report += `## 📋 ${category}\n\n`
    
    const categoryResults = allResults.filter(r => r.category === category)
    
    for (const result of categoryResults) {
      const icon = result.status === 'OK' ? '✅' : 
                   result.status === 'WARNING' ? '⚠️' : '❌'
      
      report += `${icon} **${result.message}**\n`
      
      if (result.details) {
        report += `   详情: ${result.details}\n`
      }
      report += '\n'
    }
  }

  // 添加建议
  const errors = allResults.filter(r => r.status === 'ERROR')
  if (errors.length > 0) {
    report += `## 🔧 修复建议\n\n`
    
    errors.forEach((error, index) => {
      report += `${index + 1}. **${error.category}**: ${error.message}\n`
      
      // 根据错误类型提供具体建议
      if (error.category === '文件系统') {
        report += `   建议: 检查目录权限，确保应用有读写权限\n`
      } else if (error.category === '数据库') {
        report += `   建议: 检查数据库连接字符串，运行 \`npx prisma migrate dev\`\n`
      } else if (error.category === '环境变量') {
        report += `   建议: 在 .env.local 文件中设置缺失的环境变量\n`
      } else if (error.category === '依赖包') {
        report += `   建议: 运行 \`npm install\` 安装缺失的依赖\n`
      }
      report += '\n'
    })
  }

  return report
}

/**
 * 主诊断函数
 */
async function runDiagnosis() {
  console.log('🔍 开始诊断上传功能...\n')

  const allResults: DiagnosisResult[] = []

  // 运行所有检查
  const checks = [
    { name: '文件系统权限', fn: checkFileSystemPermissions },
    { name: '数据库连接', fn: checkDatabaseConnection },
    { name: '环境变量', fn: checkEnvironmentVariables },
    { name: '依赖包', fn: checkDependencies },
    { name: 'API路由', fn: checkAPIRoutes }
  ]

  for (const check of checks) {
    console.log(`📋 检查${check.name}...`)
    try {
      const results = await check.fn()
      allResults.push(...results)
      
      const errors = results.filter(r => r.status === 'ERROR').length
      const warnings = results.filter(r => r.status === 'WARNING').length
      
      if (errors > 0) {
        console.log(`   ❌ 发现 ${errors} 个错误`)
      } else if (warnings > 0) {
        console.log(`   ⚠️ 发现 ${warnings} 个警告`)
      } else {
        console.log(`   ✅ 检查通过`)
      }
    } catch (error) {
      console.log(`   💥 检查失败: ${error}`)
      allResults.push({
        category: check.name,
        status: 'ERROR',
        message: '检查过程中发生错误',
        details: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  // 生成报告
  const report = generateReport(allResults)
  
  // 保存报告到文件
  const reportPath = `diagnosis-report-${Date.now()}.md`
  await fs.writeFile(reportPath, report)
  
  console.log(`\n📄 诊断报告已保存到: ${reportPath}`)
  console.log('\n' + report)

  // 清理数据库连接
  await prisma.$disconnect()
}

// 如果直接运行此脚本
if (require.main === module) {
  runDiagnosis().catch(console.error)
}

export { runDiagnosis }
