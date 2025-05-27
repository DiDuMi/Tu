const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTempTable() {
  try {
    // 检查是否存在临时表
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Comment%'`;
    console.log('现有Comment相关表:', tables);
    
    // 如果存在临时表，删除它
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS Comment_new`;
      console.log('临时表已清理');
    } catch (e) {
      console.log('没有临时表需要清理');
    }
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTempTable();
