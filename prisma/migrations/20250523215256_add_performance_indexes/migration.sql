-- CreateIndex
CREATE INDEX "Comment_pageId_parentId_deletedAt_idx" ON "Comment"("pageId", "parentId", "deletedAt");

-- CreateIndex
CREATE INDEX "Comment_pageId_deletedAt_createdAt_idx" ON "Comment"("pageId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Page_uuid_deletedAt_idx" ON "Page"("uuid", "deletedAt");

-- CreateIndex
CREATE INDEX "Page_status_deletedAt_idx" ON "Page"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "Page_status_featured_createdAt_idx" ON "Page"("status", "featured", "createdAt");

-- CreateIndex
CREATE INDEX "Page_categoryId_status_deletedAt_idx" ON "Page"("categoryId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Page_featured_createdAt_idx" ON "Page"("featured", "createdAt");
