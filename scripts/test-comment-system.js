const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCommentSystem() {
  try {
    console.log('🧪 测试评论系统...\n');

    // 1. 检查Comment表结构
    console.log('1. 检查Comment表结构...');
    const commentFields = await prisma.$queryRaw`PRAGMA table_info(Comment)`;
    console.log('Comment表字段:');
    commentFields.forEach(field => {
      console.log(`  - ${field.name}: ${field.type} ${field.notnull ? 'NOT NULL' : 'NULL'} ${field.dflt_value ? `DEFAULT ${field.dflt_value}` : ''}`);
    });

    // 2. 检查现有评论数据
    console.log('\n2. 检查现有评论数据...');
    const existingComments = await prisma.comment.findMany({
      select: {
        id: true,
        content: true,
        status: true,
        isAnonymous: true,
        guestId: true,
        email: true,
        pointsAwarded: true,
        createdAt: true,
      },
      take: 5,
    });
    
    console.log(`找到 ${existingComments.length} 条现有评论:`);
    existingComments.forEach(comment => {
      console.log(`  - ID: ${comment.id}, 状态: ${comment.status}, 匿名: ${comment.isAnonymous}, 游客ID: ${comment.guestId || 'N/A'}`);
    });

    // 3. 测试创建游客评论
    console.log('\n3. 测试创建游客评论...');
    const testPage = await prisma.page.findFirst({
      where: { deletedAt: null },
      select: { id: true, title: true },
    });

    if (testPage) {
      const guestComment = await prisma.comment.create({
        data: {
          content: '这是一条测试游客评论',
          pageId: testPage.id,
          isAnonymous: true,
          nickname: '测试游客',
          email: 'test@example.com',
          guestId: 'test_guest_123',
          status: 'PENDING',
        },
        include: {
          page: {
            select: { title: true },
          },
        },
      });

      console.log(`✅ 成功创建游客评论: ID=${guestComment.id}, 状态=${guestComment.status}`);
      console.log(`   内容: ${guestComment.content}`);
      console.log(`   页面: ${guestComment.page.title}`);

      // 4. 测试更新评论状态
      console.log('\n4. 测试更新评论状态...');
      const updatedComment = await prisma.comment.update({
        where: { id: guestComment.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewNote: '测试审核通过',
        },
      });

      console.log(`✅ 成功更新评论状态: ${updatedComment.status}`);

      // 5. 测试查询不同状态的评论
      console.log('\n5. 测试查询不同状态的评论...');
      const pendingComments = await prisma.comment.count({
        where: { status: 'PENDING' },
      });
      const approvedComments = await prisma.comment.count({
        where: { status: 'APPROVED' },
      });
      const rejectedComments = await prisma.comment.count({
        where: { status: 'REJECTED' },
      });

      console.log(`待审核评论: ${pendingComments} 条`);
      console.log(`已通过评论: ${approvedComments} 条`);
      console.log(`已拒绝评论: ${rejectedComments} 条`);

      // 6. 清理测试数据
      console.log('\n6. 清理测试数据...');
      await prisma.comment.delete({
        where: { id: guestComment.id },
      });
      console.log('✅ 测试数据已清理');

    } else {
      console.log('❌ 没有找到可用的页面进行测试');
    }

    console.log('\n🎉 评论系统测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCommentSystem();
