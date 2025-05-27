const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUsersToStandardGroups() {
  try {
    console.log('🔄 开始迁移用户到标准用户组...');

    // 获取所有用户组
    const allGroups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    console.log('\n当前用户组状况:');
    allGroups.forEach(group => {
      console.log(`- ${group.name} (ID: ${group.id}): ${group._count.users}个用户`);
    });

    // 获取标准用户组
    const standardGroups = {
      admin: await prisma.userGroup.findFirst({ where: { name: '管理组' } }),
      operator: await prisma.userGroup.findFirst({ where: { name: '运营组' } }),
      yearlyMember: await prisma.userGroup.findFirst({ where: { name: '年度会员组' } }),
      quarterlyMember: await prisma.userGroup.findFirst({ where: { name: '季度会员组' } }),
      monthlyMember: await prisma.userGroup.findFirst({ where: { name: '月度会员组' } }),
      registered: await prisma.userGroup.findFirst({ where: { name: '注册用户组' } }),
      guest: await prisma.userGroup.findFirst({ where: { name: '游客组' } })
    };

    // 获取旧的用户组
    const oldAdminGroup = await prisma.userGroup.findFirst({ where: { name: '管理员组' } });
    const oldMemberGroup = await prisma.userGroup.findFirst({ where: { name: '普通会员组' } });

    let migratedCount = 0;

    // 迁移管理员组用户到新的管理组
    if (oldAdminGroup) {
      const adminUsers = await prisma.user.findMany({
        where: { userGroupId: oldAdminGroup.id },
        select: { id: true, name: true, email: true, role: true }
      });

      if (adminUsers.length > 0) {
        console.log(`\n📋 迁移 ${adminUsers.length} 个管理员用户:`);
        for (const user of adminUsers) {
          await prisma.user.update({
            where: { id: user.id },
            data: { userGroupId: standardGroups.admin.id }
          });
          console.log(`  ✅ ${user.name} (${user.email}) -> 管理组`);
          migratedCount++;
        }
      } else {
        console.log('\n📋 管理员组没有用户需要迁移');
      }
    }

    // 迁移普通会员组用户到注册用户组（可以根据需要调整）
    if (oldMemberGroup) {
      const memberUsers = await prisma.user.findMany({
        where: { userGroupId: oldMemberGroup.id },
        select: { id: true, name: true, email: true, role: true }
      });

      if (memberUsers.length > 0) {
        console.log(`\n📋 迁移 ${memberUsers.length} 个普通会员用户:`);
        for (const user of memberUsers) {
          // 根据用户角色决定迁移到哪个组
          let targetGroup;
          if (user.role === 'ADMIN') {
            targetGroup = standardGroups.admin;
          } else if (user.role === 'OPERATOR') {
            targetGroup = standardGroups.operator;
          } else {
            targetGroup = standardGroups.registered; // 默认迁移到注册用户组
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { userGroupId: targetGroup.id }
          });
          console.log(`  ✅ ${user.name} (${user.email}) -> ${targetGroup.name}`);
          migratedCount++;
        }
      } else {
        console.log('\n📋 普通会员组没有用户需要迁移');
      }
    }

    console.log(`\n✅ 用户迁移完成，共迁移 ${migratedCount} 个用户`);

    // 检查是否可以删除旧的用户组
    const groupsToCheck = [oldAdminGroup, oldMemberGroup].filter(Boolean);

    for (const group of groupsToCheck) {
      const updatedGroup = await prisma.userGroup.findUnique({
        where: { id: group.id },
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      });

      if (updatedGroup._count.users === 0) {
        console.log(`\n🗑️  删除空的旧用户组: ${group.name}`);
        await prisma.userGroup.delete({ where: { id: group.id } });
      } else {
        console.log(`\n⚠️  用户组 "${group.name}" 仍有 ${updatedGroup._count.users} 个用户，暂不删除`);
      }
    }

    // 最终检查
    console.log('\n📊 迁移后的用户组状况:');
    const finalGroups = await prisma.userGroup.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    finalGroups.forEach(group => {
      console.log(`- ${group.name} (ID: ${group.id}): ${group._count.users}个用户`);
    });

  } catch (error) {
    console.error('❌ 用户迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsersToStandardGroups();
