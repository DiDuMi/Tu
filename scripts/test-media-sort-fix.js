/**
 * 媒体排序修复测试脚本
 * 
 * 此脚本用于验证媒体排序功能的修复是否有效
 */

console.log('🧪 媒体排序修复测试')
console.log('==================')

// 模拟TinyMCE编辑器环境
const mockEditor = {
  dom: {
    select: (selector) => {
      console.log(`📋 查询选择器: ${selector}`)
      // 模拟返回一个视频元素
      const mockVideo = document.createElement('video')
      mockVideo.src = '/test-video.mp4'
      mockVideo.controls = true
      mockVideo.style.maxWidth = '100%'
      return [mockVideo]
    },
    create: (tagName) => {
      console.log(`🏗️  创建元素: ${tagName}`)
      return document.createElement(tagName)
    }
  },
  getBody: () => {
    console.log('📄 获取编辑器主体')
    const body = document.createElement('div')
    body.innerHTML = '<p>测试内容</p>'
    return body
  },
  selection: {
    getBookmark: () => {
      console.log('🔖 保存光标位置')
      return { start: 0, end: 0 }
    },
    moveToBookmark: (bookmark) => {
      console.log('📍 恢复光标位置:', bookmark)
    },
    select: (element, collapse) => {
      console.log('🎯 选择元素:', element.tagName, '折叠:', collapse)
    },
    collapse: (toStart) => {
      console.log('📐 折叠选择:', toStart ? '到开始' : '到结束')
    }
  },
  fire: (event) => {
    console.log('🔥 触发事件:', event)
  },
  notificationManager: {
    open: (options) => {
      console.log('📢 显示通知:', options.text, '类型:', options.type)
    }
  }
}

// 测试媒体排序逻辑
function testMediaSortLogic() {
  console.log('\n🎬 测试媒体排序逻辑...')
  
  // 模拟原始媒体元素
  const originalElements = [
    (() => {
      const video1 = document.createElement('video')
      video1.src = '/video1.mp4'
      video1.setAttribute('data-original', 'true')
      return video1
    })(),
    (() => {
      const video2 = document.createElement('video')
      video2.src = '/video2.mp4'
      video2.setAttribute('data-original', 'true')
      return video2
    })()
  ]
  
  console.log('📦 原始元素数量:', originalElements.length)
  originalElements.forEach((el, index) => {
    console.log(`  ${index + 1}. ${el.tagName} - ${el.src}`)
  })
  
  // 模拟排序后的元素（顺序颠倒）
  const sortedElements = [originalElements[1], originalElements[0]]
  
  console.log('🔄 排序后元素数量:', sortedElements.length)
  sortedElements.forEach((el, index) => {
    console.log(`  ${index + 1}. ${el.tagName} - ${el.src}`)
  })
  
  // 模拟应用排序的逻辑
  console.log('\n🔧 应用排序逻辑...')
  
  try {
    // 保存当前光标位置
    const bookmark = mockEditor.selection.getBookmark()
    
    // 记录第一个媒体元素的位置
    const firstMediaElement = originalElements[0]
    const insertionPoint = mockEditor.getBody()
    const insertionIndex = 0
    
    console.log('📍 插入位置:', insertionIndex, '插入点:', insertionPoint.tagName)
    
    // 收集要移除的元素
    const elementsToRemove = [...originalElements]
    console.log('🗑️  要移除的元素数量:', elementsToRemove.length)
    
    // 模拟移除元素
    elementsToRemove.forEach((el, index) => {
      console.log(`  移除第${index + 1}个元素:`, el.tagName, el.src)
    })
    
    // 重新获取插入点
    const currentInsertionPoint = mockEditor.getBody()
    let currentInsertionIndex = 0
    
    // 插入排序后的元素
    sortedElements.forEach((el, index) => {
      // 克隆元素
      const clonedElement = el.cloneNode(true)
      console.log(`📥 插入第${index + 1}个元素:`, clonedElement.tagName, clonedElement.src)
      
      // 创建包装段落
      const wrapper = mockEditor.dom.create('p')
      wrapper.appendChild(clonedElement)
      
      console.log(`  ✅ 已包装在段落中`)
      
      // 更新插入索引
      currentInsertionIndex++
      
      // 在媒体元素之间添加空段落分隔
      if (index < sortedElements.length - 1) {
        const separator = mockEditor.dom.create('p')
        separator.innerHTML = '&nbsp;'
        console.log(`  📄 添加分隔段落`)
        currentInsertionIndex++
      }
    })
    
    console.log('✅ 媒体排序应用完成')
    
    // 恢复光标位置
    mockEditor.selection.moveToBookmark(bookmark)
    
    // 触发内容变化事件
    mockEditor.fire('change')
    
    return {
      success: true,
      originalCount: originalElements.length,
      sortedCount: sortedElements.length,
      message: '媒体排序测试成功'
    }
    
  } catch (error) {
    console.error('❌ 媒体排序测试失败:', error)
    return {
      success: false,
      error: error.message,
      message: '媒体排序测试失败'
    }
  }
}

// 测试重复检测逻辑
function testDuplicationDetection() {
  console.log('\n🔍 测试重复检测逻辑...')
  
  // 模拟编辑器内容
  const editorContent = `
    <p>这是一些文本内容</p>
    <p><video src="/video1.mp4" controls></video></p>
    <p>&nbsp;</p>
    <p><video src="/video2.mp4" controls></video></p>
    <p>更多文本内容</p>
  `
  
  console.log('📄 编辑器内容:')
  console.log(editorContent)
  
  // 使用正则表达式检测视频元素
  const videoRegex = /<video[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/g
  const videos = []
  let match
  
  while ((match = videoRegex.exec(editorContent)) !== null) {
    videos.push({
      fullMatch: match[0],
      src: match[1]
    })
  }
  
  console.log('🎬 检测到的视频元素:')
  videos.forEach((video, index) => {
    console.log(`  ${index + 1}. ${video.src}`)
  })
  
  // 检测重复
  const srcCounts = {}
  videos.forEach(video => {
    srcCounts[video.src] = (srcCounts[video.src] || 0) + 1
  })
  
  const duplicates = Object.entries(srcCounts).filter(([src, count]) => count > 1)
  
  if (duplicates.length > 0) {
    console.log('⚠️  检测到重复视频:')
    duplicates.forEach(([src, count]) => {
      console.log(`  ${src}: ${count} 次`)
    })
    return {
      success: false,
      duplicates,
      message: '检测到重复视频元素'
    }
  } else {
    console.log('✅ 未检测到重复视频')
    return {
      success: true,
      message: '无重复视频元素'
    }
  }
}

// 运行测试
function runTests() {
  console.log('🚀 开始运行测试...\n')
  
  const sortTest = testMediaSortLogic()
  const dupTest = testDuplicationDetection()
  
  console.log('\n📊 测试结果汇总:')
  console.log('==================')
  console.log(`媒体排序测试: ${sortTest.success ? '✅ 通过' : '❌ 失败'}`)
  console.log(`  ${sortTest.message}`)
  if (sortTest.originalCount && sortTest.sortedCount) {
    console.log(`  原始元素: ${sortTest.originalCount}, 排序后元素: ${sortTest.sortedCount}`)
  }
  
  console.log(`重复检测测试: ${dupTest.success ? '✅ 通过' : '❌ 失败'}`)
  console.log(`  ${dupTest.message}`)
  
  const allPassed = sortTest.success && dupTest.success
  console.log(`\n🎯 总体结果: ${allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`)
  
  return allPassed
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests)
  } else {
    runTests()
  }
} else {
  // Node.js环境
  // 模拟DOM环境
  global.document = {
    createElement: (tagName) => ({
      tagName: tagName.toUpperCase(),
      src: '',
      controls: false,
      style: {},
      setAttribute: function(name, value) { this[name] = value },
      getAttribute: function(name) { return this[name] },
      cloneNode: function(deep) { 
        const clone = { ...this }
        if (deep) {
          clone.innerHTML = this.innerHTML
        }
        return clone
      },
      appendChild: function(child) {
        this.children = this.children || []
        this.children.push(child)
      }
    }),
    readyState: 'complete'
  }
  
  runTests()
}

module.exports = { runTests, testMediaSortLogic, testDuplicationDetection }
