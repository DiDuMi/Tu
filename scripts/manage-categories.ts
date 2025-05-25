import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('开始管理分类...')

    // 1. 删除现有分类（先解除关联）
    console.log('正在删除现有分类...')
    
    // 解除Page与分类的关联
    await prisma.page.updateMany({
      data: {
        categoryId: null
      }
    })
    console.log('已解除所有内容与分类的关联')
    
    // 删除所有分类
    const deleteResult = await prisma.category.deleteMany({})
    console.log(`已删除 ${deleteResult.count} 个分类`)
    
    // 2. 创建新分类
    console.log('正在创建新分类...')
    
    const categories = [
      { name: '精选内容', slug: 'featured', order: 0 },
      { name: '近期流出', slug: 'recent', order: 1 },
      { name: '往期补档', slug: 'archive', order: 2 },
      { name: '公告', slug: 'announcement', order: 3 },
      { name: '教程', slug: 'tutorial', order: 4 },
      { name: '说明', slug: 'instruction', order: 5 }
    ]
    
    for (const category of categories) {
      await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          order: category.order
        }
      })
      console.log(`已创建分类: ${category.name}`)
    }
    
    console.log('分类管理完成！')
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
