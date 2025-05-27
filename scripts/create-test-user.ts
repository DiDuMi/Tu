#!/usr/bin/env tsx

/**
 * 创建测试用户脚本
 */

import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'

async function main() {
  try {
    console.log('🔧 创建测试用户...')

    // 检查是否已存在测试用户
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    })

    if (existingUser) {
      console.log('✅ 测试用户已存在:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        status: existingUser.status
      })
      return
    }

    // 创建密码哈希
    const passwordHash = await hash('123456', 12)

    // 创建测试用户
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: '测试用户',
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
      }
    })

    console.log('✅ 测试用户创建成功:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    })

    console.log('📝 登录信息:')
    console.log('邮箱: test@example.com')
    console.log('密码: 123456')

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error)
}

export { main as createTestUser }
