#!/usr/bin/env tsx

/**
 * 修复首页分类数据脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔧 开始修复首页分类数据...')
    
    // 1. 清除所有现有分类（保留已发布的内容）
    console.log('🗑️  清除现有分类数据...')
    
    // 先将所有页面的分类ID设为null，避免外键约束
    await prisma.page.updateMany({
      data: {
        categoryId: null
      }
    })
    
    // 删除所有分类
    await prisma.category.deleteMany({})
    
    console.log('✅ 现有分类数据已清除')
    
    // 2. 创建正确的首页分类
    console.log('📝 创建首页分类...')
    
    const homepageCategories = [
      {
        name: '精选内容',
        slug: 'featured',
        description: '精选推荐的高质量内容',
        order: 1
      },
      {
        name: '近期流出',
        slug: 'latest',
        description: '最新发布的内容',
        order: 2
      },
      {
        name: '往期补档',
        slug: 'archive',
        description: '历史内容和补充资料',
        order: 3
      },
      {
        name: '热门推荐',
        slug: 'trending',
        description: '热门和推荐的内容',
        order: 4
      }
    ]
    
    const createdCategories = []
    
    for (const categoryData of homepageCategories) {
      const category = await prisma.category.create({
        data: categoryData
      })
      createdCategories.push(category)
      console.log(`✅ 创建首页分类: ${category.name} (${category.slug}) - ID: ${category.id}`)
    }
    
    // 3. 创建一些通用分类（非首页分类）
    console.log('📝 创建通用分类...')
    
    const generalCategories = [
      {
        name: 'Cosplay',
        slug: 'cosplay',
        description: 'Cosplay角色扮演作品',
        order: 10
      },
      {
        name: '写真',
        slug: 'photo',
        description: '写真摄影作品',
        order: 11
      },
      {
        name: '视频',
        slug: 'video',
        description: '视频内容',
        order: 12
      },
      {
        name: '图集',
        slug: 'gallery',
        description: '图片集合',
        order: 13
      },
      {
        name: '资源',
        slug: 'resource',
        description: '各类资源分享',
        order: 14
      },
      {
        name: '其他',
        slug: 'other',
        description: '其他类型内容',
        order: 15
      }
    ]
    
    for (const categoryData of generalCategories) {
      const category = await prisma.category.create({
        data: categoryData
      })
      console.log(`✅ 创建通用分类: ${category.name} (${category.slug}) - ID: ${category.id}`)
    }
    
    // 4. 创建一些子分类
    console.log('📝 创建子分类...')
    
    const subCategories = [
      {
        name: '原神',
        slug: 'genshin',
        description: '原神角色Cosplay',
        parentSlug: 'cosplay',
        order: 1
      },
      {
        name: '崩坏3',
        slug: 'honkai3',
        description: '崩坏3角色Cosplay',
        parentSlug: 'cosplay',
        order: 2
      },
      {
        name: 'JK制服',
        slug: 'jk',
        description: 'JK制服写真',
        parentSlug: 'photo',
        order: 1
      },
      {
        name: 'Lolita',
        slug: 'lolita',
        description: 'Lolita服装写真',
        parentSlug: 'photo',
        order: 2
      }
    ]
    
    for (const subCategoryData of subCategories) {
      // 查找父分类
      const parentCategory = await prisma.category.findUnique({
        where: { slug: subCategoryData.parentSlug }
      })
      
      if (parentCategory) {
        const { parentSlug, ...categoryData } = subCategoryData
        const subCategory = await prisma.category.create({
          data: {
            ...categoryData,
            parentId: parentCategory.id
          }
        })
        console.log(`✅ 创建子分类: ${subCategory.name} -> ${parentCategory.name} (ID: ${subCategory.id})`)
      }
    }
    
    // 5. 验证结果
    const allCategories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { name: 'asc' }
      ]
    })
    
    console.log('\n📊 分类创建完成统计:')
    console.log(`📁 总分类数: ${allCategories.length}`)
    
    const homepageCategs = allCategories.filter(cat => 
      ['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
    )
    const generalCategs = allCategories.filter(cat => 
      !cat.parentId && !['featured', 'latest', 'archive', 'trending'].includes(cat.slug)
    )
    const subCategs = allCategories.filter(cat => cat.parentId)
    
    console.log(`🏠 首页分类: ${homepageCategs.length}`)
    homepageCategs.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })
    
    console.log(`📂 通用分类: ${generalCategs.length}`)
    generalCategs.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`)
    })
    
    console.log(`📁 子分类: ${subCategs.length}`)
    subCategs.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) -> ${cat.parent?.name}`)
    })
    
    console.log('\n✅ 首页分类数据修复完成！')
    console.log('\n📋 首页分类说明:')
    console.log('- 精选内容 (featured): 用于首页精选内容区域')
    console.log('- 近期流出 (latest): 用于首页近期流出区域')
    console.log('- 往期补档 (archive): 用于首页往期补档区域')
    console.log('- 热门推荐 (trending): 用于首页热门推荐区域')
    
  } catch (error) {
    console.error('❌ 修复首页分类数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as fixHomepageCategories }
