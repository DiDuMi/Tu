#!/usr/bin/env tsx

/**
 * 验证分类和标签数据脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔍 验证分类和标签数据...')
    
    // 检查分类数据
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            pages: true,
            children: true
          }
        }
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log('\n📁 分类数据:')
    console.log(`总数: ${categories.length}`)
    
    const rootCategories = categories.filter(cat => !cat.parentId)
    const subCategories = categories.filter(cat => cat.parentId)
    
    console.log('\n🌳 分类结构:')
    rootCategories.forEach(rootCat => {
      console.log(`📂 ${rootCat.name} (${rootCat.slug}) - ID: ${rootCat.id}`)
      const children = subCategories.filter(sub => sub.parentId === rootCat.id)
      children.forEach(child => {
        console.log(`  └── ${child.name} (${child.slug}) - ID: ${child.id}`)
      })
    })
    
    // 检查标签数据
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            pageTags: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('\n🏷️  标签数据:')
    console.log(`总数: ${tags.length}`)
    
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (${tag.slug}) - ID: ${tag.id}`)
    })
    
    // 检查用户数据
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })
    
    console.log('\n👤 用户数据:')
    console.log(`总数: ${users.length}`)
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.status}`)
    })
    
    // 检查媒体数据
    const mediaCount = await prisma.media.count()
    const fileHashCount = await prisma.fileHash.count()
    
    console.log('\n📸 媒体数据:')
    console.log(`媒体记录: ${mediaCount}`)
    console.log(`文件哈希: ${fileHashCount}`)
    
    console.log('\n✅ 数据验证完成！')
    console.log('\n📋 系统状态总结:')
    console.log(`📁 分类: ${categories.length} (${rootCategories.length} 主分类, ${subCategories.length} 子分类)`)
    console.log(`🏷️  标签: ${tags.length}`)
    console.log(`👤 用户: ${users.length}`)
    console.log(`📸 媒体: ${mediaCount}`)
    console.log(`🔗 文件: ${fileHashCount}`)
    
  } catch (error) {
    console.error('❌ 验证数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as verifyData }
