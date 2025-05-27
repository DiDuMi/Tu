#!/usr/bin/env tsx

/**
 * 检查分类排序脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔍 检查分类排序...')
    
    // 获取所有分类，按API相同的排序方式
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        parentId: true,
        parent: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    })
    
    console.log('\n📋 分类排序结果（按API排序）:')
    console.log('序号 | Order | 分类名称 | Slug | 父分类')
    console.log('-----|-------|----------|------|--------')
    
    categories.forEach((cat, index) => {
      const parentInfo = cat.parent ? `${cat.parent.name} (${cat.parent.slug})` : '无'
      console.log(`${(index + 1).toString().padStart(4)} | ${cat.order.toString().padStart(5)} | ${cat.name.padEnd(10)} | ${cat.slug.padEnd(10)} | ${parentInfo}`)
    })
    
    // 检查首页分类
    const homepageCategories = categories.filter(cat => 
      ['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
    )
    
    console.log('\n🏠 首页分类排序:')
    homepageCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug}) - Order: ${cat.order}`)
    })
    
    // 检查前10个分类
    console.log('\n📊 前10个分类（API返回顺序）:')
    categories.slice(0, 10).forEach((cat, index) => {
      const isHomepage = ['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
      const marker = isHomepage ? '🏠' : '📂'
      console.log(`${index + 1}. ${marker} ${cat.name} (${cat.slug}) - Order: ${cat.order}`)
    })
    
  } catch (error) {
    console.error('❌ 检查分类排序失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as checkCategoryOrder }
