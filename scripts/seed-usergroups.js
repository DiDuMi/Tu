const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function createUserGroups() {
  try {
    console.log('🔍 检查现有用户组数据...')

    // 检查现有用户组，避免删除有用户关联的组
    const existingGroups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    console.log('现有用户组:', existingGroups.map(g => `${g.name} (${g._count.users}个用户)`))

    // 只删除没有用户关联的用户组
    for (const group of existingGroups) {
      if (group._count.users === 0) {
        await prisma.userGroup.delete({ where: { id: group.id } })
        console.log(`删除空用户组: ${group.name}`)
      } else {
        console.log(`保留有用户的组: ${group.name} (${group._count.users}个用户)`)
      }
    }

    console.log('👥 创建标准用户组...')

    // 创建用户组的辅助函数
    async function createOrUpdateUserGroup(groupData) {
      const existing = await prisma.userGroup.findFirst({
        where: { name: groupData.name }
      })

      if (existing) {
        console.log(`用户组 "${groupData.name}" 已存在，跳过创建`)
        return existing
      } else {
        const created = await prisma.userGroup.create({ data: groupData })
        console.log(`创建用户组: ${groupData.name}`)
        return created
      }
    }

    // 1. 游客组
    const guestGroup = await createOrUpdateUserGroup({
      name: '游客组',
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
    })

    // 2. 注册用户组
    const registeredGroup = await createOrUpdateUserGroup({
      name: '注册用户组',
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
    })

    // 3. 月度会员组
    const monthlyMemberGroup = await createOrUpdateUserGroup({
      name: '月度会员组',
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
      previewPercentage: 50, // 月度会员可预览50%内容
    })

    // 4. 季度会员组
    const quarterlyMemberGroup = await createOrUpdateUserGroup({
      name: '季度会员组',
      description: '季度付费会员权限组',
      permissions: JSON.stringify({
        users: ['read'],
        pages: ['create', 'read', 'update'],
        media: ['create', 'read', 'update'],
        video: ['play'], // 季度会员有视频播放权限
        settings: ['read'],
      }),
      uploadLimits: JSON.stringify({
        maxFileSize: 26214400, // 25MB
        allowedTypes: ['image/*', 'video/*', 'application/pdf'],
      }),
      previewPercentage: 65, // 季度会员可预览65%内容
    })

    // 5. 年度会员组
    const yearlyMemberGroup = await createOrUpdateUserGroup({
      name: '年度会员组',
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
    })

    // 6. 运营组
    const operatorGroup = await createOrUpdateUserGroup({
      name: '运营组',
      description: '网站运营人员权限组',
      permissions: JSON.stringify({
        users: ['read', 'update'],
        pages: ['create', 'read', 'update', 'delete'],
        media: ['create', 'read', 'update', 'delete'],
        video: ['play'], // 运营组有视频播放权限
        settings: ['read'],
      }),
      uploadLimits: JSON.stringify({
        maxFileSize: 104857600, // 100MB
        allowedTypes: ['image/*', 'video/*', 'application/pdf', 'application/*'],
      }),
      previewPercentage: 100, // 运营组可预览100%内容
    })

    // 7. 管理组
    const adminGroup = await createOrUpdateUserGroup({
      name: '管理组',
      description: '拥有所有权限的管理员组',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        pages: ['create', 'read', 'update', 'delete'],
        media: ['create', 'read', 'update', 'delete'],
        video: ['play'], // 管理组有视频播放权限
        settings: ['read', 'update'],
      }),
      uploadLimits: JSON.stringify({
        maxFileSize: 1073741824, // 1GB
        allowedTypes: ['*'],
      }),
      previewPercentage: 100, // 管理组可预览100%内容
    })

    console.log('✅ 标准用户组创建/更新完成')
    console.log('用户组列表:')
    console.log(`1. ${guestGroup.name} (ID: ${guestGroup.id}) - 预览: ${guestGroup.previewPercentage}%`)
    console.log(`2. ${registeredGroup.name} (ID: ${registeredGroup.id}) - 预览: ${registeredGroup.previewPercentage}%`)
    console.log(`3. ${monthlyMemberGroup.name} (ID: ${monthlyMemberGroup.id}) - 预览: ${monthlyMemberGroup.previewPercentage}%`)
    console.log(`4. ${quarterlyMemberGroup.name} (ID: ${quarterlyMemberGroup.id}) - 预览: ${quarterlyMemberGroup.previewPercentage}%`)
    console.log(`5. ${yearlyMemberGroup.name} (ID: ${yearlyMemberGroup.id}) - 预览: ${yearlyMemberGroup.previewPercentage}%`)
    console.log(`6. ${operatorGroup.name} (ID: ${operatorGroup.id}) - 预览: ${operatorGroup.previewPercentage}%`)
    console.log(`7. ${adminGroup.name} (ID: ${adminGroup.id}) - 预览: ${adminGroup.previewPercentage}%`)

    console.log('\n📋 用户组权限说明:')
    console.log('- 游客组: 无权限，仅可浏览公开内容')
    console.log('- 注册用户组: 基础权限，可浏览20%内容')
    console.log('- 月度会员组: 付费会员，可浏览50%内容，有视频播放权限')
    console.log('- 季度会员组: 付费会员，可浏览65%内容，有视频播放权限')
    console.log('- 年度会员组: 付费会员，可浏览80%内容，有视频播放权限')
    console.log('- 运营组: 运营人员，可管理内容和媒体，100%预览权限')
    console.log('- 管理组: 最高权限，可管理所有功能和设置')

  } catch (error) {
    console.error('❌ 用户组创建失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUserGroups()
