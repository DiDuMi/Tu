/**
 * 视频压缩优化测试脚本
 * 用于验证压缩效果和性能提升
 */

const fs = require('fs')
const path = require('path')

// 测试配置
const TEST_CONFIG = {
  // 测试文件路径（需要手动放置测试视频）
  testVideosDir: path.join(__dirname, '../test-videos'),
  
  // 测试结果输出目录
  outputDir: path.join(__dirname, '../test-results'),
  
  // 测试参数组合
  testCases: [
    {
      name: '快速压缩',
      params: { crf: 28, preset: 'veryfast', codec: 'h264' },
      expectedTime: 30, // 秒
      expectedCompressionRatio: 0.4 // 40%
    },
    {
      name: '平衡压缩',
      params: { crf: 23, preset: 'medium', codec: 'h264' },
      expectedTime: 60,
      expectedCompressionRatio: 0.5
    },
    {
      name: '高质量压缩',
      params: { crf: 18, preset: 'slow', codec: 'h264' },
      expectedTime: 120,
      expectedCompressionRatio: 0.6
    },
    {
      name: 'H.265压缩',
      params: { crf: 23, preset: 'medium', codec: 'h265' },
      expectedTime: 90,
      expectedCompressionRatio: 0.7
    }
  ]
}

/**
 * 运行压缩测试
 */
async function runCompressionTest() {
  console.log('🚀 开始视频压缩优化测试...\n')
  
  // 检查测试目录
  if (!fs.existsSync(TEST_CONFIG.testVideosDir)) {
    console.error('❌ 测试视频目录不存在:', TEST_CONFIG.testVideosDir)
    console.log('请创建目录并放置测试视频文件')
    return
  }
  
  // 创建输出目录
  if (!fs.existsSync(TEST_CONFIG.outputDir)) {
    fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true })
  }
  
  // 获取测试视频文件
  const testVideos = fs.readdirSync(TEST_CONFIG.testVideosDir)
    .filter(file => /\.(mp4|avi|mov|mkv)$/i.test(file))
  
  if (testVideos.length === 0) {
    console.error('❌ 未找到测试视频文件')
    console.log('请在以下目录放置视频文件:', TEST_CONFIG.testVideosDir)
    return
  }
  
  console.log(`📹 找到 ${testVideos.length} 个测试视频:`)
  testVideos.forEach(video => console.log(`  - ${video}`))
  console.log()
  
  const results = []
  
  // 对每个视频运行所有测试用例
  for (const video of testVideos) {
    console.log(`🎬 测试视频: ${video}`)
    const videoPath = path.join(TEST_CONFIG.testVideosDir, video)
    const videoStats = fs.statSync(videoPath)
    
    console.log(`  原始大小: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`)
    
    for (const testCase of TEST_CONFIG.testCases) {
      console.log(`  📊 测试用例: ${testCase.name}`)
      
      try {
        const result = await testCompressionCase(videoPath, testCase)
        results.push({
          video,
          testCase: testCase.name,
          ...result
        })
        
        console.log(`    ✅ 完成 - 压缩率: ${(result.compressionRatio * 100).toFixed(1)}%, 时间: ${result.processingTime.toFixed(1)}s`)
      } catch (error) {
        console.log(`    ❌ 失败: ${error.message}`)
        results.push({
          video,
          testCase: testCase.name,
          error: error.message
        })
      }
    }
    console.log()
  }
  
  // 生成测试报告
  generateTestReport(results)
}

/**
 * 测试单个压缩用例
 */
async function testCompressionCase(inputPath, testCase) {
  const startTime = Date.now()
  
  // 模拟API调用（实际应该调用真实的压缩API）
  const result = await simulateCompression(inputPath, testCase.params)
  
  const endTime = Date.now()
  const processingTime = (endTime - startTime) / 1000
  
  return {
    ...result,
    processingTime,
    params: testCase.params
  }
}

/**
 * 模拟压缩过程（实际项目中应该调用真实API）
 */
async function simulateCompression(inputPath, params) {
  // 这里应该调用实际的压缩API
  // 为了演示，我们模拟一些结果
  
  const inputStats = fs.statSync(inputPath)
  const originalSize = inputStats.size
  
  // 模拟压缩效果（基于参数估算）
  let compressionRatio = 0.5 // 默认50%压缩
  
  if (params.codec === 'h265') {
    compressionRatio += 0.2 // H.265额外20%压缩
  }
  
  if (params.crf <= 20) {
    compressionRatio -= 0.1 // 高质量减少压缩
  } else if (params.crf >= 26) {
    compressionRatio += 0.1 // 低质量增加压缩
  }
  
  const compressedSize = Math.round(originalSize * (1 - compressionRatio))
  
  // 模拟处理延迟
  const delay = params.preset === 'veryfast' ? 100 : 
                params.preset === 'fast' ? 200 :
                params.preset === 'medium' ? 500 : 1000
  
  await new Promise(resolve => setTimeout(resolve, delay))
  
  return {
    originalSize,
    compressedSize,
    compressionRatio,
    success: true
  }
}

/**
 * 生成测试报告
 */
function generateTestReport(results) {
  console.log('📋 生成测试报告...\n')
  
  const reportPath = path.join(TEST_CONFIG.outputDir, `compression-test-${Date.now()}.json`)
  const htmlReportPath = path.join(TEST_CONFIG.outputDir, `compression-test-${Date.now()}.html`)
  
  // 保存JSON报告
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  
  // 生成HTML报告
  const htmlReport = generateHtmlReport(results)
  fs.writeFileSync(htmlReportPath, htmlReport)
  
  // 控制台摘要
  console.log('📊 测试摘要:')
  console.log('=' * 50)
  
  const successResults = results.filter(r => !r.error)
  const failedResults = results.filter(r => r.error)
  
  console.log(`总测试数: ${results.length}`)
  console.log(`成功: ${successResults.length}`)
  console.log(`失败: ${failedResults.length}`)
  
  if (successResults.length > 0) {
    const avgCompressionRatio = successResults.reduce((sum, r) => sum + r.compressionRatio, 0) / successResults.length
    const avgProcessingTime = successResults.reduce((sum, r) => sum + r.processingTime, 0) / successResults.length
    
    console.log(`平均压缩率: ${(avgCompressionRatio * 100).toFixed(1)}%`)
    console.log(`平均处理时间: ${avgProcessingTime.toFixed(1)}s`)
  }
  
  console.log(`\n📄 详细报告已保存:`)
  console.log(`  JSON: ${reportPath}`)
  console.log(`  HTML: ${htmlReportPath}`)
}

/**
 * 生成HTML报告
 */
function generateHtmlReport(results) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>视频压缩测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: green; }
        .error { color: red; }
        .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>视频压缩优化测试报告</h1>
    <div class="summary">
        <h2>测试摘要</h2>
        <p>测试时间: ${new Date().toLocaleString()}</p>
        <p>总测试数: ${results.length}</p>
        <p>成功: ${results.filter(r => !r.error).length}</p>
        <p>失败: ${results.filter(r => r.error).length}</p>
    </div>
    
    <h2>详细结果</h2>
    <table>
        <tr>
            <th>视频文件</th>
            <th>测试用例</th>
            <th>原始大小(MB)</th>
            <th>压缩后大小(MB)</th>
            <th>压缩率</th>
            <th>处理时间(s)</th>
            <th>状态</th>
        </tr>
        ${results.map(r => `
        <tr>
            <td>${r.video}</td>
            <td>${r.testCase}</td>
            <td>${r.originalSize ? (r.originalSize / 1024 / 1024).toFixed(2) : '-'}</td>
            <td>${r.compressedSize ? (r.compressedSize / 1024 / 1024).toFixed(2) : '-'}</td>
            <td>${r.compressionRatio ? (r.compressionRatio * 100).toFixed(1) + '%' : '-'}</td>
            <td>${r.processingTime ? r.processingTime.toFixed(1) : '-'}</td>
            <td class="${r.error ? 'error' : 'success'}">${r.error || '成功'}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>
  `
}

// 运行测试
if (require.main === module) {
  runCompressionTest().catch(console.error)
}

module.exports = {
  runCompressionTest,
  TEST_CONFIG
}
