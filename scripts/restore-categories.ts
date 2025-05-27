#!/usr/bin/env tsx

/**
 * 恢复分类数据脚本
 */

import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.log('🔧 开始恢复分类数据...')

    // 检查现有分类
    const existingCategories = await prisma.category.findMany()
    console.log(`📊 当前分类数量: ${existingCategories.length}`)

    if (existingCategories.length > 0) {
      console.log('✅ 分类数据已存在，无需恢复')
      existingCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
      return
    }

    // 创建基础分类数据
    const categories = [
      {
        name: 'Cosplay',
        slug: 'cosplay',
        description: 'Cosplay角色扮演作品',
        order: 1
      },
      {
        name: '写真',
        slug: 'photo',
        description: '写真摄影作品',
        order: 2
      },
      {
        name: '二次元',
        slug: 'anime',
        description: '二次元动漫相关内容',
        order: 3
      },
      {
        name: '三次元',
        slug: 'real',
        description: '三次元真人内容',
        order: 4
      },
      {
        name: '视频',
        slug: 'video',
        description: '视频内容',
        order: 5
      },
      {
        name: '图集',
        slug: 'gallery',
        description: '图片集合',
        order: 6
      },
      {
        name: '资源',
        slug: 'resource',
        description: '各类资源分享',
        order: 7
      },
      {
        name: '其他',
        slug: 'other',
        description: '其他类型内容',
        order: 8
      }
    ]

    console.log('📝 创建基础分类...')

    for (const categoryData of categories) {
      const category = await prisma.category.create({
        data: categoryData
      })
      console.log(`✅ 创建分类: ${category.name} (ID: ${category.id})`)
    }

    // 创建一些子分类
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
      },
      {
        name: '汉服',
        slug: 'hanfu',
        description: '汉服写真',
        parentSlug: 'photo',
        order: 3
      }
    ]

    console.log('📝 创建子分类...')

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

    // 创建一些基础标签
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
      { name: '萝莉', slug: 'loli' }
    ]

    console.log('📝 创建基础标签...')

    for (const tagData of tags) {
      const tag = await prisma.tag.create({
        data: tagData
      })
      console.log(`✅ 创建标签: ${tag.name}`)
    }

    // 统计结果
    const finalCategoryCount = await prisma.category.count()
    const finalTagCount = await prisma.tag.count()

    console.log('\n📊 恢复完成统计:')
    console.log(`📁 分类总数: ${finalCategoryCount}`)
    console.log(`🏷️  标签总数: ${finalTagCount}`)

    console.log('\n✅ 分类和标签数据恢复完成！')

  } catch (error) {
    console.error('❌ 恢复分类数据失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as restoreCategories }
