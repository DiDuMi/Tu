import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 更新"精选内容"为"精选推荐"...')

  try {
    // 查找现有的"精选内容"分类
    const featuredCategory = await prisma.category.findFirst({
      where: { 
        OR: [
          { name: '精选内容' },
          { slug: 'featured' }
        ]
      }
    })

    if (featuredCategory) {
      console.log(`📝 找到分类: ${featuredCategory.name} (${featuredCategory.slug})`)
      
      // 更新分类名称
      const updatedCategory = await prisma.category.update({
        where: { id: featuredCategory.id },
        data: {
          name: '精选推荐',
          description: '平台推荐的高质量内容'
        }
      })

      console.log(`✅ 已更新分类: ${updatedCategory.name}`)
    } else {
      console.log('⚠️  未找到"精选内容"分类')
    }

    // 验证更新结果
    const verifyCategory = await prisma.category.findUnique({
      where: { slug: 'featured' }
    })

    if (verifyCategory) {
      console.log(`🔍 验证结果: ${verifyCategory.name} (${verifyCategory.slug})`)
    }

    console.log('🎉 更新完成！')

  } catch (error) {
    console.error('❌ 更新分类时出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
