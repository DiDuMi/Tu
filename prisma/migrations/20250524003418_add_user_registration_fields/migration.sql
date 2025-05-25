-- AlterTable
ALTER TABLE "User" ADD COLUMN "applicationReason" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;

-- CreateIndex
CREATE INDEX "User_telegramUsername_idx" ON "User"("telegramUsername");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");
