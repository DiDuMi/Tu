const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserGroups() {
  try {
    const userGroups = await prisma.userGroup.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        previewPercentage: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });
    
    console.log('\n📊 当前用户组数据:');
    console.log('ID | 名称         | 描述                 | 预览% | 用户数');
    console.log('---|-------------|---------------------|-------|-------');
    userGroups.forEach(group => {
      const id = group.id.toString().padEnd(2);
      const name = group.name.padEnd(12);
      const desc = (group.description || '').substring(0, 20).padEnd(20);
      const preview = group.previewPercentage.toString().padEnd(5);
      const userCount = group._count.users;
      console.log(`${id} | ${name} | ${desc} | ${preview} | ${userCount}`);
    });
    
    console.log('\n✅ 总共', userGroups.length, '个用户组');
    
    // 检查是否包含所有必需的用户组
    const requiredGroups = [
      '游客组', '注册用户组', '月度会员组', 
      '季度会员组', '年度会员组', '运营组', '管理组'
    ];
    
    const existingGroupNames = userGroups.map(g => g.name);
    const missingGroups = requiredGroups.filter(name => !existingGroupNames.includes(name));
    
    if (missingGroups.length === 0) {
      console.log('🎉 所有必需的用户组都已存在！');
    } else {
      console.log('⚠️  缺少以下用户组:', missingGroups.join(', '));
    }
    
  } catch (error) {
    console.error('检查用户组数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserGroups();
