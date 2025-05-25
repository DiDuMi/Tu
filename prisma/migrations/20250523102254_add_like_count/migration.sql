-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentBlocks" TEXT,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "scheduledPublishAt" DATETIME,
    "scheduledArchiveAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Page_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Page" ("categoryId", "content", "contentBlocks", "createdAt", "deletedAt", "excerpt", "featured", "id", "publishedAt", "scheduledArchiveAt", "scheduledPublishAt", "status", "title", "updatedAt", "userId", "uuid", "viewCount") SELECT "categoryId", "content", "contentBlocks", "createdAt", "deletedAt", "excerpt", "featured", "id", "publishedAt", "scheduledArchiveAt", "scheduledPublishAt", "status", "title", "updatedAt", "userId", "uuid", "viewCount" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_uuid_key" ON "Page"("uuid");
CREATE INDEX "Page_userId_idx" ON "Page"("userId");
CREATE INDEX "Page_categoryId_idx" ON "Page"("categoryId");
CREATE INDEX "Page_status_idx" ON "Page"("status");
CREATE INDEX "Page_featured_idx" ON "Page"("featured");
CREATE INDEX "Page_publishedAt_idx" ON "Page"("publishedAt");
CREATE INDEX "Page_scheduledPublishAt_idx" ON "Page"("scheduledPublishAt");
CREATE INDEX "Page_scheduledArchiveAt_idx" ON "Page"("scheduledArchiveAt");
CREATE INDEX "Page_createdAt_idx" ON "Page"("createdAt");
CREATE INDEX "Page_deletedAt_idx" ON "Page"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
