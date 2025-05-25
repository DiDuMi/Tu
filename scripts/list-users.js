const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc'
      }
    })

    console.log('现有用户列表:')
    console.log('=' * 50)
    users.forEach(user => {
      console.log(`ID: ${user.id}`)
      console.log(`姓名: ${user.name}`)
      console.log(`邮箱: ${user.email}`)
      console.log(`状态: ${user.status}`)
      console.log(`创建时间: ${user.createdAt.toLocaleString('zh-CN')}`)
      console.log('-'.repeat(30))
    })

    console.log(`\n总计: ${users.length} 个用户`)

  } catch (error) {
    console.error('查询用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
