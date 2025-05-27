const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleMigrate() {
  try {
    console.log('🔄 开始简单迁移...');

    // 1. 检查所有用户和他们的用户组
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userGroupId: true,
        userGroup: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('\n👥 当前用户状况:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - 角色: ${user.role} - 用户组: ${user.userGroup?.name || '无'}`);
    });

    // 2. 获取新的管理组
    const newAdminGroup = await prisma.userGroup.findFirst({
      where: { name: '管理组' }
    });

    const newRegisteredGroup = await prisma.userGroup.findFirst({
      where: { name: '注册用户组' }
    });

    if (!newAdminGroup || !newRegisteredGroup) {
      console.log('❌ 找不到新的用户组');
      return;
    }

    console.log(`\n📋 新用户组信息:`);
    console.log(`- 管理组 ID: ${newAdminGroup.id}`);
    console.log(`- 注册用户组 ID: ${newRegisteredGroup.id}`);

    // 3. 迁移用户
    let migratedCount = 0;
    for (const user of users) {
      let targetGroupId;
      let targetGroupName;

      if (user.role === 'ADMIN') {
        targetGroupId = newAdminGroup.id;
        targetGroupName = '管理组';
      } else {
        targetGroupId = newRegisteredGroup.id;
        targetGroupName = '注册用户组';
      }

      if (user.userGroupId !== targetGroupId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { userGroupId: targetGroupId }
        });
        console.log(`✅ 迁移用户: ${user.name} -> ${targetGroupName}`);
        migratedCount++;
      } else {
        console.log(`⏭️  跳过用户: ${user.name} (已在正确的用户组)`);
      }
    }

    console.log(`\n✅ 迁移完成，共迁移 ${migratedCount} 个用户`);

    // 4. 检查旧用户组是否可以删除
    const oldGroups = await prisma.userGroup.findMany({
      where: {
        name: {
          in: ['管理员组', '普通会员组']
        }
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log('\n🗑️  检查旧用户组:');
    for (const group of oldGroups) {
      if (group._count.users === 0) {
        console.log(`删除空用户组: ${group.name}`);
        await prisma.userGroup.delete({ where: { id: group.id } });
      } else {
        console.log(`保留用户组: ${group.name} (还有 ${group._count.users} 个用户)`);
      }
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleMigrate();
