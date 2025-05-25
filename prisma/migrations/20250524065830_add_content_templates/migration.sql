-- CreateTable
CREATE TABLE "ContentTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ContentTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateTag_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContentTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTemplate_uuid_key" ON "ContentTemplate"("uuid");

-- CreateIndex
CREATE INDEX "ContentTemplate_userId_idx" ON "ContentTemplate"("userId");

-- CreateIndex
CREATE INDEX "ContentTemplate_type_idx" ON "ContentTemplate"("type");

-- CreateIndex
CREATE INDEX "ContentTemplate_isPublic_idx" ON "ContentTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ContentTemplate_isActive_idx" ON "ContentTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ContentTemplate_useCount_idx" ON "ContentTemplate"("useCount");

-- CreateIndex
CREATE INDEX "ContentTemplate_sortOrder_idx" ON "ContentTemplate"("sortOrder");

-- CreateIndex
CREATE INDEX "ContentTemplate_deletedAt_idx" ON "ContentTemplate"("deletedAt");

-- CreateIndex
CREATE INDEX "TemplateTag_templateId_idx" ON "TemplateTag"("templateId");

-- CreateIndex
CREATE INDEX "TemplateTag_tagId_idx" ON "TemplateTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTag_templateId_tagId_key" ON "TemplateTag"("templateId", "tagId");
