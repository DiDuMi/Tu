#!/usr/bin/env tsx

/**
 * 创建标签数据脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🏷️  开始创建标签数据...')
    
    // 检查现有标签
    const existingTags = await prisma.tag.findMany()
    console.log(`📊 当前标签数量: ${existingTags.length}`)
    
    if (existingTags.length > 0) {
      console.log('✅ 标签数据已存在')
      existingTags.forEach(tag => {
        console.log(`  - ${tag.name} (${tag.slug})`)
      })
      return
    }
    
    // 创建基础标签
    const tags = [
      { name: '热门', slug: 'hot' },
      { name: '推荐', slug: 'recommend' },
      { name: '精品', slug: 'premium' },
      { name: '新人', slug: 'newcomer' },
      { name: '福利', slug: 'welfare' },
      { name: '清纯', slug: 'pure' },
      { name: '性感', slug: 'sexy' },
      { name: '可爱', slug: 'cute' },
      { name: '御姐', slug: 'mature' },
      { name: '萝莉', slug: 'loli' },
      { name: '制服', slug: 'uniform' },
      { name: '泳装', slug: 'swimsuit' },
      { name: '内衣', slug: 'lingerie' },
      { name: '丝袜', slug: 'stockings' },
      { name: '高跟鞋', slug: 'heels' }
    ]
    
    console.log('📝 创建基础标签...')
    
    for (const tagData of tags) {
      const tag = await prisma.tag.create({
        data: tagData
      })
      console.log(`✅ 创建标签: ${tag.name}`)
    }
    
    // 统计结果
    const finalTagCount = await prisma.tag.count()
    
    console.log('\n📊 创建完成统计:')
    console.log(`🏷️  标签总数: ${finalTagCount}`)
    
    console.log('\n✅ 标签数据创建完成！')
    
  } catch (error) {
    console.error('❌ 创建标签数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as createTags }
