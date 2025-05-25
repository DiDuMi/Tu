const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function createUserGroups() {
  try {
    console.log('🧹 清理现有用户组数据...')

    // 清理现有用户组数据
    await prisma.userGroup.deleteMany()

    console.log('👥 创建用户组...')

    // 创建用户组
    const guestGroup = await prisma.userGroup.create({
      data: {
        name: '游客',
        description: '未注册用户或访客权限组',
        permissions: JSON.stringify({
          users: [],
          pages: ['read'],
          media: ['read'],
          video: [], // 游客无视频播放权限
          settings: [],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 0,
          allowedTypes: [],
        }),
        previewPercentage: 0, // 游客无法预览内容
      },
    })

    const registeredGroup = await prisma.userGroup.create({
      data: {
        name: '注册用户',
        description: '已注册但未付费的用户权限组',
        permissions: JSON.stringify({
          users: ['read'],
          pages: ['read'],
          media: ['read'],
          video: [], // 注册用户无视频播放权限
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 1048576, // 1MB
          allowedTypes: ['image/*'],
        }),
        previewPercentage: 20, // 注册用户可预览20%内容
      },
    })

    const monthlyMemberGroup = await prisma.userGroup.create({
      data: {
        name: '月度会员',
        description: '月度付费会员权限组',
        permissions: JSON.stringify({
          users: ['read'],
          pages: ['create', 'read', 'update'],
          media: ['create', 'read', 'update'],
          video: ['play'], // 月度会员有视频播放权限
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 10485760, // 10MB
          allowedTypes: ['image/*', 'video/*'],
        }),
        previewPercentage: 60, // 月度会员可预览60%内容
      },
    })

    const yearlyMemberGroup = await prisma.userGroup.create({
      data: {
        name: '年度会员',
        description: '年度付费会员权限组',
        permissions: JSON.stringify({
          users: ['read'],
          pages: ['create', 'read', 'update'],
          media: ['create', 'read', 'update'],
          video: ['play'], // 年度会员有视频播放权限
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 52428800, // 50MB
          allowedTypes: ['image/*', 'video/*', 'application/pdf'],
        }),
        previewPercentage: 80, // 年度会员可预览80%内容
      },
    })

    const lifetimeMemberGroup = await prisma.userGroup.create({
      data: {
        name: '终身会员',
        description: '终身付费会员权限组',
        permissions: JSON.stringify({
          users: ['read'],
          pages: ['create', 'read', 'update'],
          media: ['create', 'read', 'update', 'delete'],
          video: ['play'], // 终身会员有视频播放权限
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 104857600, // 100MB
          allowedTypes: ['image/*', 'video/*', 'application/pdf', 'application/*'],
        }),
        previewPercentage: 100, // 终身会员可预览100%内容
      },
    })

    const operatorGroup = await prisma.userGroup.create({
      data: {
        name: '操作员',
        description: '网站操作员权限组',
        permissions: JSON.stringify({
          users: ['read', 'update'],
          pages: ['create', 'read', 'update', 'delete'],
          media: ['create', 'read', 'update', 'delete'],
          video: ['play'], // 操作员有视频播放权限
          settings: ['read'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 104857600, // 100MB
          allowedTypes: ['image/*', 'video/*', 'application/pdf', 'application/*'],
        }),
        previewPercentage: 100, // 操作员可预览100%内容
      },
    })

    const adminGroup = await prisma.userGroup.create({
      data: {
        name: '管理员',
        description: '拥有所有权限的管理员组',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          pages: ['create', 'read', 'update', 'delete'],
          media: ['create', 'read', 'update', 'delete'],
          video: ['play'], // 管理员有视频播放权限
          settings: ['read', 'update'],
        }),
        uploadLimits: JSON.stringify({
          maxFileSize: 1073741824, // 1GB
          allowedTypes: ['*'],
        }),
        previewPercentage: 100, // 管理员可预览100%内容
      },
    })

    console.log('✅ 用户组创建完成')
    console.log('创建的用户组:')
    console.log(`1. ${guestGroup.name} (ID: ${guestGroup.id}) - 预览: ${guestGroup.previewPercentage}%`)
    console.log(`2. ${registeredGroup.name} (ID: ${registeredGroup.id}) - 预览: ${registeredGroup.previewPercentage}%`)
    console.log(`3. ${monthlyMemberGroup.name} (ID: ${monthlyMemberGroup.id}) - 预览: ${monthlyMemberGroup.previewPercentage}%`)
    console.log(`4. ${yearlyMemberGroup.name} (ID: ${yearlyMemberGroup.id}) - 预览: ${yearlyMemberGroup.previewPercentage}%`)
    console.log(`5. ${lifetimeMemberGroup.name} (ID: ${lifetimeMemberGroup.id}) - 预览: ${lifetimeMemberGroup.previewPercentage}%`)
    console.log(`6. ${operatorGroup.name} (ID: ${operatorGroup.id}) - 预览: ${operatorGroup.previewPercentage}%`)
    console.log(`7. ${adminGroup.name} (ID: ${adminGroup.id}) - 预览: ${adminGroup.previewPercentage}%`)

  } catch (error) {
    console.error('❌ 用户组创建失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUserGroups()
