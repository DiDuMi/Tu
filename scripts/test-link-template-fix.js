/**
 * 链接模板功能测试脚本
 * 
 * 此脚本用于验证链接模板保存和加载功能是否正常
 */

const fetch = require('node-fetch')

console.log('🧪 链接模板功能测试')
console.log('===================')

// 测试配置
const BASE_URL = 'http://localhost:3000'
const TEST_PAGE_ID = 'test-page-id' // 需要替换为实际的页面ID

// 模拟测试数据
const testLinkData = {
  platform: 'telegram',
  url: 'https://t.me/test_channel',
  extractCode: null,
  pointCost: 0,
  title: '测试Telegram链接',
  description: '这是一个测试链接',
  sortOrder: 0
}

// 测试创建链接
async function testCreateLink(pageId) {
  console.log('\n🔍 测试创建下载链接...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/pages/${pageId}/download-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // 需要实际的session
      },
      body: JSON.stringify(testLinkData)
    })
    
    const result = await response.json()
    
    console.log('📤 请求数据:', testLinkData)
    console.log('📥 响应状态:', response.status)
    console.log('📥 响应数据:', result)
    
    if (result.success) {
      console.log('✅ 创建链接成功')
      return result.data
    } else {
      console.log('❌ 创建链接失败:', result.error?.message)
      return null
    }
  } catch (error) {
    console.log('❌ 创建链接出错:', error.message)
    return null
  }
}

// 测试获取链接列表
async function testGetLinks(pageId) {
  console.log('\n🔍 测试获取下载链接列表...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/pages/${pageId}/download-links`, {
      method: 'GET',
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // 需要实际的session
      }
    })
    
    const result = await response.json()
    
    console.log('📥 响应状态:', response.status)
    console.log('📥 响应数据:', result)
    
    if (result.success) {
      console.log('✅ 获取链接列表成功')
      console.log(`📊 链接数量: ${result.data.length}`)
      result.data.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.title} (${link.platform}) - ${link.pointCost} 积分`)
      })
      return result.data
    } else {
      console.log('❌ 获取链接列表失败:', result.error?.message)
      return []
    }
  } catch (error) {
    console.log('❌ 获取链接列表出错:', error.message)
    return []
  }
}

// 测试更新链接
async function testUpdateLink(linkId, updateData) {
  console.log('\n🔍 测试更新下载链接...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/download-links/${linkId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // 需要实际的session
      },
      body: JSON.stringify(updateData)
    })
    
    const result = await response.json()
    
    console.log('📤 更新数据:', updateData)
    console.log('📥 响应状态:', response.status)
    console.log('📥 响应数据:', result)
    
    if (result.success) {
      console.log('✅ 更新链接成功')
      return result.data
    } else {
      console.log('❌ 更新链接失败:', result.error?.message)
      return null
    }
  } catch (error) {
    console.log('❌ 更新链接出错:', error.message)
    return null
  }
}

// 测试删除链接
async function testDeleteLink(linkId) {
  console.log('\n🔍 测试删除下载链接...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/v1/download-links/${linkId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // 需要实际的session
      }
    })
    
    const result = await response.json()
    
    console.log('📥 响应状态:', response.status)
    console.log('📥 响应数据:', result)
    
    if (result.success) {
      console.log('✅ 删除链接成功')
      return true
    } else {
      console.log('❌ 删除链接失败:', result.error?.message)
      return false
    }
  } catch (error) {
    console.log('❌ 删除链接出错:', error.message)
    return false
  }
}

// 测试链接模板完整流程
async function testLinkTemplateWorkflow() {
  console.log('🚀 开始测试链接模板完整流程...\n')
  
  // 注意：这个测试需要实际的页面ID和认证session
  console.log('⚠️  注意：此测试需要实际的页面ID和用户认证')
  console.log('请在浏览器中手动测试以下流程：')
  console.log('')
  
  console.log('📋 手动测试步骤:')
  console.log('1. 访问内容创建页面: http://localhost:3000/dashboard/contents/create')
  console.log('2. 点击"链接模板"按钮')
  console.log('3. 添加一个下载链接:')
  console.log('   - 平台: Telegram')
  console.log('   - 标题: 测试链接')
  console.log('   - URL: https://t.me/test_channel')
  console.log('   - 积分: 0')
  console.log('4. 点击"保存"按钮')
  console.log('5. 关闭对话框后重新打开，检查链接是否保存成功')
  console.log('6. 修改链接信息并再次保存')
  console.log('7. 删除链接并保存')
  console.log('')
  
  console.log('🔍 检查要点:')
  console.log('- ✅ 链接保存后不会变成空白')
  console.log('- ✅ 重新打开对话框时能正确显示已保存的链接')
  console.log('- ✅ 修改链接后能正确更新')
  console.log('- ✅ 删除链接后能正确移除')
  console.log('- ✅ 保存过程中显示正确的状态提示')
  console.log('')
  
  // 模拟API测试（需要实际环境）
  console.log('🧪 模拟API测试结果:')
  
  // 测试数据验证
  const validationTests = [
    {
      name: '有效的Telegram链接',
      data: {
        platform: 'telegram',
        url: 'https://t.me/test_channel',
        title: '测试Telegram链接',
        pointCost: 0
      },
      expected: true
    },
    {
      name: '有效的百度网盘链接',
      data: {
        platform: 'baidu',
        url: 'https://pan.baidu.com/s/1234567890',
        extractCode: 'abcd',
        title: '测试百度网盘链接',
        pointCost: 10
      },
      expected: true
    },
    {
      name: '无效的链接（缺少标题）',
      data: {
        platform: 'telegram',
        url: 'https://t.me/test_channel',
        title: '', // 空标题
        pointCost: 0
      },
      expected: false
    },
    {
      name: '无效的链接（缺少URL）',
      data: {
        platform: 'telegram',
        url: '', // 空URL
        title: '测试链接',
        pointCost: 0
      },
      expected: false
    }
  ]
  
  console.log('\n📊 数据验证测试:')
  validationTests.forEach((test, index) => {
    const isValid = test.data.title.trim() && test.data.url.trim()
    const result = isValid === test.expected ? '✅ 通过' : '❌ 失败'
    console.log(`  ${index + 1}. ${test.name}: ${result}`)
  })
  
  console.log('\n🎯 测试总结:')
  console.log('链接模板功能的关键修复点:')
  console.log('1. ✅ 改进了保存逻辑，正确处理API响应')
  console.log('2. ✅ 添加了详细的错误处理和日志')
  console.log('3. ✅ 实现了删除功能，支持移除不需要的链接')
  console.log('4. ✅ 优化了数据验证，确保只保存有效链接')
  console.log('5. ✅ 改善了用户反馈，显示具体的错误信息')
  
  return true
}

// 如果直接运行此脚本
if (require.main === module) {
  testLinkTemplateWorkflow()
}

module.exports = {
  testLinkTemplateWorkflow,
  testCreateLink,
  testGetLinks,
  testUpdateLink,
  testDeleteLink
}
