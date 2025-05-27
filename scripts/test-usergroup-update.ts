import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 测试用户组更新功能...')

  try {
    // 1. 查找一个测试用户组
    console.log('\n1️⃣ 查找测试用户组...')
    const testGroup = await prisma.userGroup.findFirst({
      where: { name: '注册用户' }
    })

    if (!testGroup) {
      console.log('❌ 未找到测试用户组')
      return
    }

    console.log(`✅ 找到测试用户组: ${testGroup.name} (ID: ${testGroup.id})`)

    // 2. 检查当前权限配置
    console.log('\n2️⃣ 检查当前权限配置...')
    let currentPermissions = {}
    try {
      currentPermissions = JSON.parse(testGroup.permissions as string)
      console.log('当前权限:', JSON.stringify(currentPermissions, null, 2))
    } catch (error) {
      console.error('解析权限失败:', error)
    }

    // 3. 准备测试更新数据
    console.log('\n3️⃣ 准备测试更新数据...')
    const testPermissions = {
      pages: ['read', 'create'],
      media: ['read', 'create'],
      comments: ['read', 'create'],
      video: ['play']
    }

    const updateData = {
      description: '测试更新 - ' + new Date().toISOString(),
      permissions: JSON.stringify(testPermissions),
      previewPercentage: 100
    }

    console.log('测试更新数据:', JSON.stringify(updateData, null, 2))

    // 4. 执行更新
    console.log('\n4️⃣ 执行更新...')
    const updatedGroup = await prisma.userGroup.update({
      where: { id: testGroup.id },
      data: updateData
    })

    console.log('✅ 更新成功!')
    console.log('更新后的用户组:', {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      permissions: JSON.parse(updatedGroup.permissions as string),
      previewPercentage: updatedGroup.previewPercentage
    })

    // 5. 验证更新结果
    console.log('\n5️⃣ 验证更新结果...')
    const verifyGroup = await prisma.userGroup.findUnique({
      where: { id: testGroup.id }
    })

    if (verifyGroup) {
      const verifyPermissions = JSON.parse(verifyGroup.permissions as string)
      console.log('验证权限配置:', JSON.stringify(verifyPermissions, null, 2))
      
      // 检查权限是否正确更新
      const isCorrect = JSON.stringify(verifyPermissions) === JSON.stringify(testPermissions)
      console.log(isCorrect ? '✅ 权限更新正确' : '❌ 权限更新有误')
    }

    console.log('\n🎉 用户组更新功能测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    if (error instanceof Error) {
      console.error('错误详情:', error.message)
      console.error('错误堆栈:', error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
