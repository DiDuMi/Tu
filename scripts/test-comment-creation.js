const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCommentCreation() {
  try {
    console.log('🧪 测试评论创建功能...\n');

    // 1. 获取一个测试页面
    const testPage = await prisma.page.findFirst({
      where: { deletedAt: null },
      select: { id: true, title: true, uuid: true },
    });

    if (!testPage) {
      console.log('❌ 没有找到可用的页面进行测试');
      return;
    }

    console.log(`📄 使用测试页面: ${testPage.title} (ID: ${testPage.id})`);

    // 2. 获取一个测试用户
    const testUser = await prisma.user.findFirst({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true },
    });

    if (!testUser) {
      console.log('❌ 没有找到可用的用户进行测试');
      return;
    }

    console.log(`👤 使用测试用户: ${testUser.name} (ID: ${testUser.id})`);

    // 3. 测试注册用户评论
    console.log('\n📝 测试注册用户评论...');
    try {
      const userComment = await prisma.comment.create({
        data: {
          content: '这是一条测试注册用户评论',
          pageId: testPage.id,
          userId: testUser.id,
          isAnonymous: false,
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          page: {
            select: {
              title: true,
            },
          },
        },
      });

      console.log('✅ 注册用户评论创建成功:');
      console.log(`   ID: ${userComment.id}`);
      console.log(`   内容: ${userComment.content}`);
      console.log(`   状态: ${userComment.status}`);
      console.log(`   用户: ${userComment.user.name}`);
      console.log(`   页面: ${userComment.page.title}`);

      // 清理测试数据
      await prisma.comment.delete({ where: { id: userComment.id } });
      console.log('   ✅ 测试数据已清理');

    } catch (error) {
      console.log('❌ 注册用户评论创建失败:', error.message);
      console.log('错误详情:', error);
    }

    // 4. 测试游客评论
    console.log('\n👻 测试游客评论...');
    try {
      const guestComment = await prisma.comment.create({
        data: {
          content: '这是一条测试游客评论',
          pageId: testPage.id,
          userId: null,
          isAnonymous: true,
          nickname: '测试游客',
          email: 'test@example.com',
          guestId: 'test_guest_' + Date.now(),
          status: 'PENDING',
        },
        include: {
          page: {
            select: {
              title: true,
            },
          },
        },
      });

      console.log('✅ 游客评论创建成功:');
      console.log(`   ID: ${guestComment.id}`);
      console.log(`   内容: ${guestComment.content}`);
      console.log(`   状态: ${guestComment.status}`);
      console.log(`   昵称: ${guestComment.nickname}`);
      console.log(`   邮箱: ${guestComment.email}`);
      console.log(`   游客ID: ${guestComment.guestId}`);
      console.log(`   页面: ${guestComment.page.title}`);

      // 清理测试数据
      await prisma.comment.delete({ where: { id: guestComment.id } });
      console.log('   ✅ 测试数据已清理');

    } catch (error) {
      console.log('❌ 游客评论创建失败:', error.message);
      console.log('错误详情:', error);
    }

    // 5. 测试审核功能
    console.log('\n🔍 测试评论审核功能...');
    try {
      // 创建一个测试评论
      const reviewComment = await prisma.comment.create({
        data: {
          content: '这是一条待审核的测试评论',
          pageId: testPage.id,
          userId: testUser.id,
          isAnonymous: false,
          status: 'PENDING',
        },
      });

      console.log(`✅ 创建待审核评论: ID=${reviewComment.id}`);

      // 模拟审核通过
      const reviewedComment = await prisma.comment.update({
        where: { id: reviewComment.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: testUser.id, // 使用测试用户作为审核人
          reviewNote: '测试审核通过',
        },
      });

      console.log(`✅ 审核通过: 状态=${reviewedComment.status}, 审核人=${reviewedComment.reviewedBy}`);

      // 清理测试数据
      await prisma.comment.delete({ where: { id: reviewComment.id } });
      console.log('   ✅ 测试数据已清理');

    } catch (error) {
      console.log('❌ 评论审核测试失败:', error.message);
      console.log('错误详情:', error);
    }

    console.log('\n🎉 评论功能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCommentCreation();
