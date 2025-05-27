import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 验证社区种子数据...')

  try {
    // 1. 验证用户组
    console.log('\n📝 验证用户组...')
    const userGroups = await prisma.userGroup.findMany({
      orderBy: { id: 'asc' }
    })
    
    console.log(`✅ 找到 ${userGroups.length} 个用户组:`)
    userGroups.forEach(group => {
      console.log(`   - ${group.name}: ${group.description}`)
    })

    // 2. 验证分类
    console.log('\n📂 验证分类...')
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' }
    })
    
    console.log(`✅ 找到 ${categories.length} 个分类:`)
    categories.forEach(category => {
      console.log(`   - ${category.name} (${category.slug}): ${category.description}`)
    })

    // 3. 验证标签
    console.log('\n🏷️  验证标签...')
    const tags = await prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    })
    
    console.log(`✅ 找到 ${tags.length} 个标签:`)
    tags.forEach(tag => {
      console.log(`   - ${tag.name} (${tag.slug})`)
    })

    // 4. 验证管理员用户
    console.log('\n👤 验证管理员用户...')
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@tu105.com' },
      include: { userGroup: true }
    })
    
    if (admin) {
      console.log(`✅ 管理员用户已创建:`)
      console.log(`   - 姓名: ${admin.name}`)
      console.log(`   - 邮箱: ${admin.email}`)
      console.log(`   - 角色: ${admin.role}`)
      console.log(`   - 状态: ${admin.status}`)
      console.log(`   - 用户组: ${admin.userGroup?.name}`)
    } else {
      console.log('❌ 管理员用户未找到')
    }

    // 5. 验证示例内容
    console.log('\n📄 验证示例内容...')
    const pages = await prisma.page.findMany({
      where: { deletedAt: null },
      include: { 
        category: true,
        user: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`✅ 找到 ${pages.length} 个页面:`)
    pages.forEach(page => {
      console.log(`   - ${page.title}`)
      console.log(`     分类: ${page.category?.name || '无'}`)
      console.log(`     作者: ${page.user.name}`)
      console.log(`     状态: ${page.status}`)
      console.log(`     精选: ${page.featured ? '是' : '否'}`)
    })

    // 6. 验证首页分类内容
    console.log('\n🏠 验证首页分类内容...')
    
    const featuredCategory = await prisma.category.findUnique({
      where: { slug: 'featured' }
    })
    
    if (featuredCategory) {
      const featuredPages = await prisma.page.findMany({
        where: {
          categoryId: featuredCategory.id,
          status: 'PUBLISHED',
          deletedAt: null
        }
      })
      console.log(`✅ 精选推荐分类有 ${featuredPages.length} 个内容`)
    }

    const latestCategory = await prisma.category.findUnique({
      where: { slug: 'latest' }
    })
    
    if (latestCategory) {
      const latestPages = await prisma.page.findMany({
        where: {
          categoryId: latestCategory.id,
          status: 'PUBLISHED',
          deletedAt: null
        }
      })
      console.log(`✅ 近期流出分类有 ${latestPages.length} 个内容`)
    }

    // 7. 验证权限配置
    console.log('\n🔐 验证权限配置...')
    const adminGroup = await prisma.userGroup.findFirst({
      where: { name: '管理员' }
    })
    
    if (adminGroup) {
      const permissions = JSON.parse(adminGroup.permissions)
      console.log(`✅ 管理员组权限配置:`)
      console.log(`   - 页面权限: ${Object.keys(permissions.pages || {}).join(', ')}`)
      console.log(`   - 首页权限: ${Object.keys(permissions.homepage || {}).join(', ')}`)
    }

    console.log('\n🎉 种子数据验证完成！')
    console.log('\n📋 总结:')
    console.log(`   - 用户组: ${userGroups.length} 个`)
    console.log(`   - 分类: ${categories.length} 个`)
    console.log(`   - 标签: ${tags.length} 个`)
    console.log(`   - 示例内容: ${pages.length} 个`)
    console.log(`   - 管理员用户: ${admin ? '已创建' : '未创建'}`)

  } catch (error) {
    console.error('❌ 验证种子数据时出错:', error)
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
