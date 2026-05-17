-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'business',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "targetAudience" TEXT,
    "tonality" TEXT NOT NULL DEFAULT 'professional',
    "language" TEXT NOT NULL DEFAULT 'de',
    "addressingStyle" TEXT NOT NULL DEFAULT 'Sie',
    "useEmojis" BOOLEAN NOT NULL DEFAULT false,
    "hashtagStyle" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "noGos" TEXT NOT NULL DEFAULT '[]',
    "preferredTerms" TEXT NOT NULL DEFAULT '[]',
    "avoidedTerms" TEXT NOT NULL DEFAULT '[]',
    "exampleTexts" TEXT NOT NULL DEFAULT '[]',
    "postingGoals" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'personal',
    "accountName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "pageId" TEXT,
    "igUserId" TEXT,
    "metadata" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentTheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentTheme_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentIdea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "themeId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'general',
    "format" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "coreMessage" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "targetGroup" TEXT NOT NULL,
    "imageIdea" TEXT,
    "videoIdea" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentIdea_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ContentTheme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "socialAccountId" TEXT,
    "ideaId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hook" TEXT,
    "cta" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'facebook',
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "format" TEXT NOT NULL DEFAULT 'standard',
    "style" TEXT NOT NULL DEFAULT 'professional',
    "targetGroup" TEXT NOT NULL DEFAULT 'general',
    "hashtags" TEXT NOT NULL DEFAULT '[]',
    "firstComment" TEXT,
    "notes" TEXT,
    "imageIdea" TEXT,
    "videoIdea" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "platformPostId" TEXT,
    "publishError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ContentIdea" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "filename" TEXT NOT NULL,
    "filesize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "aspectRatio" TEXT,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "aiPrompt" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Media_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_workspaceId_key" ON "BrandProfile"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_workspaceId_platform_accountId_key" ON "SocialAccount"("workspaceId", "platform", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PostMedia_postId_mediaId_key" ON "PostMedia"("postId", "mediaId");
