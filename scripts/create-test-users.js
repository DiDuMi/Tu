const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function createTestUsers() {
  try {
    console.log('开始创建测试用户...')

    // 创建待审核用户
    const pendingUser = await prisma.user.create({
      data: {
        name: '待审核用户',
        email: 'pending@test.com',
        password: await hash('Test123!', 10),
        status: 'PENDING',
        role: 'REGISTERED',
        telegramUsername: 'pending_user',
        telegramId: '123456789',
        applicationReason: '我想加入这个平台学习和分享内容，希望能够与其他用户交流经验。',
      },
    })
    console.log('✅ 创建待审核用户成功:', pendingUser.email)

    // 创建已拒绝用户
    const rejectedUser = await prisma.user.create({
      data: {
        name: '被拒绝用户',
        email: 'rejected@test.com',
        password: await hash('Test123!', 10),
        status: 'REJECTED',
        role: 'REGISTERED',
        telegramUsername: 'rejected_user',
        telegramId: '987654321',
        applicationReason: '申请加入平台',
      },
    })
    console.log('✅ 创建被拒绝用户成功:', rejectedUser.email)

    // 为被拒绝用户创建拒绝日志
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        module: 'USER_MANAGEMENT',
        action: 'USER_REJECTED',
        message: `用户 ${rejectedUser.name} (${rejectedUser.email}) 被拒绝`,
        details: JSON.stringify({
          userId: rejectedUser.id,
          userEmail: rejectedUser.email,
          action: 'reject',
          reason: '申请信息不够详细，请提供更多关于您使用平台目的的信息。',
          applicationReason: rejectedUser.applicationReason,
        }),
      },
    })
    console.log('✅ 创建拒绝日志成功')

    // 创建正常用户（用于对比）
    const activeUser = await prisma.user.create({
      data: {
        name: '正常用户',
        email: 'active@test.com',
        password: await hash('Test123!', 10),
        status: 'ACTIVE',
        role: 'REGISTERED',
        telegramUsername: 'active_user',
        telegramId: '555666777',
        applicationReason: '我是一个内容创作者，希望在这个平台分享我的作品。',
      },
    })
    console.log('✅ 创建正常用户成功:', activeUser.email)

    console.log('\n🎉 所有测试用户创建完成！')
    console.log('\n测试账号信息：')
    console.log('1. 待审核用户: pending@test.com / Test123!')
    console.log('2. 被拒绝用户: rejected@test.com / Test123!')
    console.log('3. 正常用户: active@test.com / Test123!')
    console.log('\n您可以使用这些账号测试不同的登录状态提醒功能。')

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUsers()
