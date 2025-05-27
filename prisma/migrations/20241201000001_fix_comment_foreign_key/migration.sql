-- 添加外键约束
-- 注意：SQLite 不支持直接添加外键约束，需要重建表

-- 创建临时表（按照现有表的字段顺序）
CREATE TABLE "Comment_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "pageId" INTEGER NOT NULL,
    "userId" INTEGER,
    "parentId" INTEGER,
    "email" TEXT,
    "guestId" TEXT,
    "pointsAwarded" BOOLEAN NOT NULL DEFAULT false,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "reviewedBy" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Comment_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 复制数据（按照现有表的字段顺序）
INSERT INTO "Comment_new" (
    "id", "uuid", "content", "isAnonymous", "nickname", "createdAt", "updatedAt", "deletedAt",
    "pageId", "userId", "parentId", "email", "guestId", "pointsAwarded", "reviewNote",
    "reviewedAt", "reviewedBy", "status"
)
SELECT
    "id", "uuid", "content", "isAnonymous", "nickname", "createdAt", "updatedAt", "deletedAt",
    "pageId", "userId", "parentId", "email", "guestId", "pointsAwarded", "reviewNote",
    "reviewedAt", "reviewedBy", "status"
FROM "Comment";

-- 删除旧表
DROP TABLE "Comment";

-- 重命名新表
ALTER TABLE "Comment_new" RENAME TO "Comment";

-- 重新创建唯一索引
CREATE UNIQUE INDEX "Comment_uuid_key" ON "Comment"("uuid");

-- 重新创建其他索引
CREATE INDEX "Comment_pageId_idx" ON "Comment"("pageId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
CREATE INDEX "Comment_status_idx" ON "Comment"("status");
CREATE INDEX "Comment_guestId_idx" ON "Comment"("guestId");
CREATE INDEX "Comment_reviewedBy_idx" ON "Comment"("reviewedBy");
CREATE INDEX "Comment_pageId_parentId_deletedAt_idx" ON "Comment"("pageId", "parentId", "deletedAt");
CREATE INDEX "Comment_pageId_deletedAt_createdAt_idx" ON "Comment"("pageId", "deletedAt", "createdAt");
CREATE INDEX "Comment_pageId_status_deletedAt_idx" ON "Comment"("pageId", "status", "deletedAt");
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");
