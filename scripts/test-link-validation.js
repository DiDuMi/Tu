/**
 * 链接模板数据验证测试脚本
 * 
 * 此脚本用于测试链接模板的数据验证逻辑
 */

const { z } = require('zod')

console.log('🧪 链接模板数据验证测试')
console.log('========================')

// 复制API中的验证模式
const createDownloadLinkSchema = z.object({
  platform: z.string().min(1, '请选择网盘平台'),
  url: z.string().min(1, '请输入下载链接').refine((url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, '请输入有效的下载链接'),
  extractCode: z.string().optional().nullable(),
  pointCost: z.number().min(0, '积分不能为负数').max(10000, '积分不能超过10000'),
  title: z.string().min(1, '请输入链接标题').max(100, '标题不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional().nullable(),
  sortOrder: z.number().default(0)
})

// 测试数据集
const testCases = [
  {
    name: '用户实际输入的数据',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: undefined,
      pointCost: 13,
      title: '色的个人套',
      description: undefined,
      sortOrder: 0
    },
    expected: true
  },
  {
    name: '字符串类型的积分（前端可能发送的）',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: undefined,
      pointCost: '13', // 字符串类型
      title: '色的个人套',
      description: undefined,
      sortOrder: 0
    },
    expected: false
  },
  {
    name: '空字符串的提取码',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: '',
      pointCost: 13,
      title: '色的个人套',
      description: '',
      sortOrder: 0
    },
    expected: true
  },
  {
    name: 'null值的可选字段',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: null,
      pointCost: 13,
      title: '色的个人套',
      description: null,
      sortOrder: 0
    },
    expected: true
  },
  {
    name: '百度网盘链接',
    data: {
      platform: 'baidu',
      url: 'https://pan.baidu.com/s/1234567890',
      extractCode: 'abcd',
      pointCost: 10,
      title: '百度网盘下载',
      description: '完整资源包',
      sortOrder: 0
    },
    expected: true
  },
  {
    name: '无效的URL',
    data: {
      platform: 'telegram',
      url: 'invalid-url',
      extractCode: undefined,
      pointCost: 13,
      title: '色的个人套',
      description: undefined,
      sortOrder: 0
    },
    expected: false
  },
  {
    name: '空标题',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: undefined,
      pointCost: 13,
      title: '',
      description: undefined,
      sortOrder: 0
    },
    expected: false
  },
  {
    name: '负数积分',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: undefined,
      pointCost: -5,
      title: '色的个人套',
      description: undefined,
      sortOrder: 0
    },
    expected: false
  },
  {
    name: '超大积分',
    data: {
      platform: 'telegram',
      url: 'https://t.me/c/2328853234/1/569',
      extractCode: undefined,
      pointCost: 15000,
      title: '色的个人套',
      description: undefined,
      sortOrder: 0
    },
    expected: false
  }
]

// 运行测试
function runValidationTests() {
  console.log('🚀 开始运行验证测试...\n')
  
  let passedTests = 0
  let totalTests = testCases.length
  
  testCases.forEach((testCase, index) => {
    console.log(`📋 测试 ${index + 1}: ${testCase.name}`)
    console.log('📤 输入数据:', JSON.stringify(testCase.data, null, 2))
    
    try {
      const result = createDownloadLinkSchema.safeParse(testCase.data)
      const isValid = result.success
      
      console.log(`📥 验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`)
      
      if (!result.success) {
        console.log('📝 错误详情:', result.error.format())
      } else {
        console.log('📝 解析后数据:', JSON.stringify(result.data, null, 2))
      }
      
      const testPassed = isValid === testCase.expected
      console.log(`🎯 测试结果: ${testPassed ? '✅ 符合预期' : '❌ 不符合预期'}`)
      
      if (testPassed) {
        passedTests++
      }
      
    } catch (error) {
      console.log('❌ 测试执行出错:', error.message)
    }
    
    console.log('─'.repeat(50))
  })
  
  console.log(`\n📊 测试总结:`)
  console.log(`通过测试: ${passedTests}/${totalTests}`)
  console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！')
  } else {
    console.log('⚠️  部分测试失败，需要检查验证逻辑')
  }
  
  return passedTests === totalTests
}

// 测试数据类型转换
function testDataTypeConversion() {
  console.log('\n🔧 测试数据类型转换...')
  
  const originalData = {
    platform: 'telegram',
    url: 'https://t.me/c/2328853234/1/569',
    extractCode: '',
    pointCost: '13', // 字符串
    title: '色的个人套',
    description: '',
    sortOrder: '0' // 字符串
  }
  
  console.log('📤 原始数据:', JSON.stringify(originalData, null, 2))
  
  // 应用前端的数据转换逻辑
  const convertedData = {
    platform: originalData.platform,
    url: originalData.url.trim(),
    extractCode: originalData.extractCode || undefined,
    pointCost: Number(originalData.pointCost) || 0,
    title: originalData.title.trim(),
    description: originalData.description?.trim() || undefined,
    sortOrder: Number(originalData.sortOrder) || 0
  }
  
  console.log('📥 转换后数据:', JSON.stringify(convertedData, null, 2))
  
  const result = createDownloadLinkSchema.safeParse(convertedData)
  console.log(`🎯 验证结果: ${result.success ? '✅ 通过' : '❌ 失败'}`)
  
  if (!result.success) {
    console.log('📝 错误详情:', result.error.format())
  }
  
  return result.success
}

// 如果直接运行此脚本
if (require.main === module) {
  const validationTestsPassed = runValidationTests()
  const conversionTestPassed = testDataTypeConversion()
  
  console.log('\n🎯 总体结果:')
  console.log(`验证测试: ${validationTestsPassed ? '✅ 通过' : '❌ 失败'}`)
  console.log(`转换测试: ${conversionTestPassed ? '✅ 通过' : '❌ 失败'}`)
  
  if (validationTestsPassed && conversionTestPassed) {
    console.log('\n🎉 所有测试通过！链接模板验证逻辑正常工作。')
  } else {
    console.log('\n⚠️  部分测试失败，需要进一步调试。')
  }
}

module.exports = {
  runValidationTests,
  testDataTypeConversion,
  createDownloadLinkSchema
}
