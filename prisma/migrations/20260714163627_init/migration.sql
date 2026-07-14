-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "email" STRING NOT NULL,
    "passwordHash" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" STRING NOT NULL,
    "title" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "blurb" STRING NOT NULL DEFAULT '',
    "coverUrl" STRING,
    "genres" STRING NOT NULL DEFAULT '[]',
    "type" STRING NOT NULL DEFAULT 'SINGLE',
    "visibility" STRING NOT NULL DEFAULT 'DRAFT',
    "order" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" STRING NOT NULL,
    "bookId" STRING NOT NULL,
    "title" STRING NOT NULL DEFAULT '',
    "slug" STRING NOT NULL DEFAULT 'main',
    "blurb" STRING NOT NULL DEFAULT '',
    "coverUrl" STRING,
    "order" INT4 NOT NULL DEFAULT 0,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" STRING NOT NULL,
    "storyId" STRING NOT NULL,
    "title" STRING NOT NULL,
    "slug" STRING NOT NULL,
    "order" INT4 NOT NULL DEFAULT 0,
    "showInIndex" BOOL NOT NULL DEFAULT true,
    "content" STRING NOT NULL DEFAULT '{"scenes":[]}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemePreset" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "config" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" STRING NOT NULL,
    "url" STRING NOT NULL,
    "kind" STRING NOT NULL DEFAULT 'PHOTO',
    "width" INT4,
    "height" INT4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- Unlock tables so the following index/foreign-key changes are allowed.
-- CockroachDB v26.2 creates tables with schema_locked = true by default.
ALTER TABLE "User" SET (schema_locked = false);
ALTER TABLE "Book" SET (schema_locked = false);
ALTER TABLE "Story" SET (schema_locked = false);
ALTER TABLE "Chapter" SET (schema_locked = false);
ALTER TABLE "ThemePreset" SET (schema_locked = false);
ALTER TABLE "Asset" SET (schema_locked = false);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Story_bookId_slug_key" ON "Story"("bookId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_storyId_slug_key" ON "Chapter"("storyId", "slug");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-lock tables (recommended default for changefeed performance).
ALTER TABLE "User" SET (schema_locked = true);
ALTER TABLE "Book" SET (schema_locked = true);
ALTER TABLE "Story" SET (schema_locked = true);
ALTER TABLE "Chapter" SET (schema_locked = true);
ALTER TABLE "ThemePreset" SET (schema_locked = true);
ALTER TABLE "Asset" SET (schema_locked = true);

