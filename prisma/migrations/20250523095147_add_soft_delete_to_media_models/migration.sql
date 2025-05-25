-- AlterTable
ALTER TABLE "MediaCategory" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "MediaTag" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "MediaCategory_deletedAt_idx" ON "MediaCategory"("deletedAt");

-- CreateIndex
CREATE INDEX "MediaTag_deletedAt_idx" ON "MediaTag"("deletedAt");
