/*
  Warnings:

  - You are about to drop the column `signInSettings` on the `UserGroup` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ApiKey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "keyName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "lastUsedAt" DATETIME,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SignInRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "signInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "continuousDays" INTEGER NOT NULL DEFAULT 1,
    "pointsEarned" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'web',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "apiKeyId" INTEGER,
    "extraData" TEXT,
    CONSTRAINT "SignInRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SignInRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SignInRecord" ("continuousDays", "id", "pointsEarned", "signInDate", "userId") SELECT "continuousDays", "id", "pointsEarned", "signInDate", "userId" FROM "SignInRecord";
DROP TABLE "SignInRecord";
ALTER TABLE "new_SignInRecord" RENAME TO "SignInRecord";
CREATE INDEX "SignInRecord_userId_idx" ON "SignInRecord"("userId");
CREATE INDEX "SignInRecord_signInDate_idx" ON "SignInRecord"("signInDate");
CREATE INDEX "SignInRecord_source_idx" ON "SignInRecord"("source");
CREATE INDEX "SignInRecord_apiKeyId_idx" ON "SignInRecord"("apiKeyId");
CREATE UNIQUE INDEX "SignInRecord_userId_signInDate_key" ON "SignInRecord"("userId", "signInDate");
CREATE TABLE "new_UserGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "uploadLimits" TEXT,
    "previewPercentage" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserGroup" ("createdAt", "description", "id", "name", "permissions", "previewPercentage", "updatedAt", "uploadLimits", "uuid") SELECT "createdAt", "description", "id", "name", "permissions", "previewPercentage", "updatedAt", "uploadLimits", "uuid" FROM "UserGroup";
DROP TABLE "UserGroup";
ALTER TABLE "new_UserGroup" RENAME TO "UserGroup";
CREATE UNIQUE INDEX "UserGroup_uuid_key" ON "UserGroup"("uuid");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_uuid_key" ON "ApiKey"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_apiKey_key" ON "ApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_apiKey_idx" ON "ApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");

-- CreateIndex
CREATE INDEX "ApiKey_lastUsedAt_idx" ON "ApiKey"("lastUsedAt");
