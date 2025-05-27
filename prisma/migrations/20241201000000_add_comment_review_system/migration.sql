-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "email" TEXT;
ALTER TABLE "Comment" ADD COLUMN "guestId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "pointsAwarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Comment" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "Comment" ADD COLUMN "reviewedBy" INTEGER;
ALTER TABLE "Comment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_guestId_idx" ON "Comment"("guestId");

-- CreateIndex
CREATE INDEX "Comment_reviewedBy_idx" ON "Comment"("reviewedBy");
