const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCommentTable() {
  try {
    const result = await prisma.$queryRaw`PRAGMA table_info(Comment)`;
    console.log('Comment表当前结构:');
    result.forEach(field => {
      console.log(`  ${field.name}: ${field.type} ${field.notnull ? 'NOT NULL' : 'NULL'} ${field.dflt_value ? `DEFAULT ${field.dflt_value}` : ''}`);
    });

    // 检查现有数据
    const commentCount = await prisma.comment.count();
    console.log(`\n当前评论数量: ${commentCount}`);

    if (commentCount > 0) {
      const sampleComment = await prisma.comment.findFirst({
        select: {
          id: true,
          pointsAwarded: true,
          status: true,
          email: true,
          guestId: true,
        }
      });
      console.log('示例评论数据:', sampleComment);
    }

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCommentTable();
