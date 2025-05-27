#!/usr/bin/env tsx

/**
 * 修复分类排序脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔧 修复分类排序...')
    
    // 1. 设置首页分类的order值为负数，确保它们排在最前面
    const homepageUpdates = [
      { slug: 'featured', order: -4, name: '精选内容' },
      { slug: 'latest', order: -3, name: '近期流出' },
      { slug: 'archive', order: -2, name: '往期补档' },
      { slug: 'trending', order: -1, name: '热门推荐' },
    ]
    
    console.log('📝 更新首页分类排序...')
    
    for (const update of homepageUpdates) {
      await prisma.category.update({
        where: { slug: update.slug },
        data: { order: update.order }
      })
      console.log(`✅ 更新 ${update.name} (${update.slug}) order: ${update.order}`)
    }
    
    // 2. 重新设置子分类的order值，避免冲突
    console.log('📝 更新子分类排序...')
    
    const subCategoryUpdates = [
      { slug: 'genshin', order: 1, name: '原神' },
      { slug: 'honkai3', order: 2, name: '崩坏3' },
      { slug: 'jk', order: 1, name: 'JK制服' },
      { slug: 'lolita', order: 2, name: 'Lolita' },
    ]
    
    for (const update of subCategoryUpdates) {
      await prisma.category.update({
        where: { slug: update.slug },
        data: { order: update.order }
      })
      console.log(`✅ 更新 ${update.name} (${update.slug}) order: ${update.order}`)
    }
    
    // 3. 验证排序结果
    console.log('\n🔍 验证排序结果...')
    
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
    
    console.log('\n📋 新的分类排序（前10个）:')
    categories.slice(0, 10).forEach((cat, index) => {
      const isHomepage = ['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
      const marker = isHomepage ? '🏠' : '📂'
      const parentInfo = cat.parent ? ` (${cat.parent.name})` : ''
      console.log(`${index + 1}. ${marker} ${cat.name}${parentInfo} - Order: ${cat.order}`)
    })
    
    // 4. 检查首页分类是否在前4位
    const homepageCategories = categories.filter(cat => 
      ['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
    )
    
    console.log('\n🏠 首页分类排序验证:')
    homepageCategories.forEach((cat, index) => {
      const position = categories.findIndex(c => c.id === cat.id) + 1
      console.log(`${index + 1}. ${cat.name} (${cat.slug}) - 位置: ${position}, Order: ${cat.order}`)
    })
    
    const allHomepageInTop4 = homepageCategories.every(cat => {
      const position = categories.findIndex(c => c.id === cat.id)
      return position < 4
    })
    
    if (allHomepageInTop4) {
      console.log('\n✅ 首页分类排序修复成功！所有首页分类都在前4位。')
    } else {
      console.log('\n❌ 首页分类排序仍有问题，需要进一步调整。')
    }
    
  } catch (error) {
    console.error('❌ 修复分类排序失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as fixCategoryOrder }
