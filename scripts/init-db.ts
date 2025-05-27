import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  try {
    // 检查是否已有管理员用户
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        deletedAt: null
      }
    })

    console.log('现有管理员用户:', adminUser)

    if (!adminUser) {
      console.log('创建默认管理员用户...')

      // 创建默认用户组
      const adminGroup = await prisma.userGroup.upsert({
        where: { name: '管理员' },
        update: {},
        create: {
          name: '管理员',
          description: '系统管理员组',
          previewPercentage: 100,
          permissions: JSON.stringify({
            content: ['create', 'read', 'update', 'delete', 'publish'],
            media: ['upload', 'manage', 'delete'],
            user: ['create', 'read', 'update', 'delete'],
            system: ['settings', 'logs', 'backup']
          })
        }
      })

      const operatorGroup = await prisma.userGroup.upsert({
        where: { name: '操作员' },
        update: {},
        create: {
          name: '操作员',
          description: '内容操作员组',
          previewPercentage: 100,
          permissions: JSON.stringify({
            content: ['create', 'read', 'update', 'publish'],
            media: ['upload', 'manage'],
            user: ['read']
          })
        }
      })

      const userGroup = await prisma.userGroup.upsert({
        where: { name: '注册用户' },
        update: {},
        create: {
          name: '注册用户',
          description: '普通注册用户组',
          previewPercentage: 30,
          permissions: JSON.stringify({
            content: ['read'],
            media: ['read']
          })
        }
      })

      // 创建默认管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 12)

      const admin = await prisma.user.create({
        data: {
          name: '系统管理员',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          userGroupId: adminGroup.id,
          emailVerified: new Date(),
        }
      })

      console.log('默认管理员用户创建成功:', {
        id: admin.id,
        email: admin.email,
        name: admin.name
      })

      // 创建默认分类
      const categories = [
        { name: '公告', slug: 'announcements', description: '系统公告和通知' },
        { name: '教程', slug: 'tutorials', description: '使用教程和指南' },
        { name: '说明', slug: 'guides', description: '功能说明和文档' },
        { name: '精选', slug: 'featured', description: '精选内容' },
        { name: '近期', slug: 'recent', description: '近期内容' },
        { name: '往期', slug: 'archive', description: '往期内容' },
        { name: '热门', slug: 'trending', description: '热门内容' }
      ]

      for (const category of categories) {
        await prisma.category.upsert({
          where: { slug: category.slug },
          update: {},
          create: category
        })
      }

      console.log('默认分类创建成功')

      // 创建默认标签
      const tags = [
        { name: '重要', slug: 'important', color: '#ef4444' },
        { name: '新功能', slug: 'new-feature', color: '#10b981' },
        { name: '更新', slug: 'update', color: '#3b82f6' },
        { name: '教程', slug: 'tutorial', color: '#8b5cf6' },
        { name: '技巧', slug: 'tips', color: '#f59e0b' }
      ]

      for (const tag of tags) {
        await prisma.tag.upsert({
          where: { slug: tag.slug },
          update: {},
          create: tag
        })
      }

      console.log('默认标签创建成功')

    } else {
      console.log('管理员用户已存在，跳过初始化')
    }

    console.log('数据库初始化完成！')

    // 显示登录信息
    console.log('\n=== 登录信息 ===')
    console.log('管理员账号: admin@example.com')
    console.log('管理员密码: admin123')
    console.log('================\n')

  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
