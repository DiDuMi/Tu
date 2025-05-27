const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestAccounts() {
  console.log('🔧 开始创建测试账号...')

  try {
    // 1. 创建用户组（如果不存在）
    let adminGroup = await prisma.userGroup.findFirst({
      where: { name: '管理员' }
    })

    if (!adminGroup) {
      adminGroup = await prisma.userGroup.create({
        data: {
          name: '管理员',
          description: '系统管理员组',
          permissions: JSON.stringify({
            admin: true,
            manage_users: true,
            manage_content: true,
            manage_media: true,
            manage_system: true
          }),
          previewPercentage: 100
        }
      })
    }

    let memberGroup = await prisma.userGroup.findFirst({
      where: { name: '注册用户' }
    })

    if (!memberGroup) {
      memberGroup = await prisma.userGroup.create({
        data: {
          name: '注册用户',
          description: '普通注册用户组',
          permissions: JSON.stringify({
            view_content: true,
            comment: true,
            like: true,
            favorite: true
          }),
          previewPercentage: 30
        }
      })
    }

    // 2. 创建测试账号
    const testAccounts = [
      {
        name: '管理员',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'ADMIN',
        status: 'ACTIVE',
        userGroupId: adminGroup.id,
        bio: '系统管理员测试账号'
      },
      {
        name: '运营人员',
        email: 'operator@test.com',
        password: 'operator123',
        role: 'OPERATOR',
        status: 'ACTIVE',
        userGroupId: adminGroup.id,
        bio: '运营人员测试账号'
      },
      {
        name: '年费会员',
        email: 'annual@test.com',
        password: 'annual123',
        role: 'ANNUAL_MEMBER',
        status: 'ACTIVE',
        userGroupId: memberGroup.id,
        bio: '年费会员测试账号'
      },
      {
        name: '普通会员',
        email: 'member@test.com',
        password: 'member123',
        role: 'MEMBER',
        status: 'ACTIVE',
        userGroupId: memberGroup.id,
        bio: '普通会员测试账号'
      },
      {
        name: '注册用户',
        email: 'user@test.com',
        password: 'user123',
        role: 'REGISTERED',
        status: 'ACTIVE',
        userGroupId: memberGroup.id,
        bio: '注册用户测试账号'
      },
      {
        name: '待审核用户',
        email: 'pending@test.com',
        password: 'pending123',
        role: 'REGISTERED',
        status: 'PENDING',
        userGroupId: memberGroup.id,
        bio: '待审核用户测试账号',
        applicationReason: '希望加入社区分享和交流'
      }
    ]

    for (const account of testAccounts) {
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      })

      if (existingUser) {
        console.log(`⚠️  用户 ${account.email} 已存在，跳过创建`)
        continue
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(account.password, 12)

      // 创建用户
      const user = await prisma.user.create({
        data: {
          ...account,
          password: hashedPassword,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=random`
        }
      })

      // 创建用户积分记录
      await prisma.userPoint.create({
        data: {
          userId: user.id,
          balance: account.role === 'ADMIN' ? 10000 : 1000,
          totalEarned: account.role === 'ADMIN' ? 10000 : 1000
        }
      })

      console.log(`✅ 创建用户: ${account.name} (${account.email})`)
    }

    // 3. 创建一些基础分类
    const categories = [
      { name: 'Cosplay', slug: 'cosplay', description: 'Cosplay相关内容' },
      { name: '写真', slug: 'photo', description: '写真摄影作品' },
      { name: '二次元', slug: 'anime', description: '二次元相关内容' },
      { name: '三次元', slug: 'real', description: '三次元真人内容' }
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      })
    }

    console.log('✅ 创建基础分类完成')

    // 4. 创建一些标签
    const tags = [
      { name: '热门', slug: 'hot' },
      { name: '推荐', slug: 'recommended' },
      { name: '精选', slug: 'featured' },
      { name: '新人', slug: 'newcomer' },
      { name: '高清', slug: 'hd' }
    ]

    for (const tag of tags) {
      const existingTag = await prisma.tag.findFirst({
        where: {
          OR: [
            { name: tag.name },
            { slug: tag.slug }
          ]
        }
      })

      if (!existingTag) {
        await prisma.tag.create({
          data: {
            ...tag,
            description: `${tag.name}标签`
          }
        })
      }
    }

    console.log('✅ 创建基础标签完成')

    console.log('\n🎉 测试账号创建完成！')
    console.log('\n📋 测试账号列表：')
    console.log('┌─────────────┬─────────────────────┬─────────────┬──────────────┐')
    console.log('│ 角色        │ 邮箱                │ 密码        │ 状态         │')
    console.log('├─────────────┼─────────────────────┼─────────────┼──────────────┤')
    console.log('│ 管理员      │ admin@test.com      │ admin123    │ ACTIVE       │')
    console.log('│ 运营人员    │ operator@test.com   │ operator123 │ ACTIVE       │')
    console.log('│ 年费会员    │ annual@test.com     │ annual123   │ ACTIVE       │')
    console.log('│ 普通会员    │ member@test.com     │ member123   │ ACTIVE       │')
    console.log('│ 注册用户    │ user@test.com       │ user123     │ ACTIVE       │')
    console.log('│ 待审核用户  │ pending@test.com    │ pending123  │ PENDING      │')
    console.log('└─────────────┴─────────────────────┴─────────────┴──────────────┘')
    console.log('\n🔗 登录地址: http://localhost:3000/auth/signin')

  } catch (error) {
    console.error('❌ 创建测试账号失败:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestAccounts()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { createTestAccounts }
