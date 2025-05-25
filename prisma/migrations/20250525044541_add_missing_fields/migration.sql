-- AlterTable
ALTER TABLE "Media" ADD COLUMN "size" INTEGER;
ALTER TABLE "Media" ADD COLUMN "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Tag_deletedAt_idx" ON "Tag"("deletedAt");
