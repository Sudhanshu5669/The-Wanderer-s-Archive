import "server-only";
import { prisma } from "./db";
import { safeParseTheme, type SavedPreset } from "./theme";

export async function getThemePresets(): Promise<SavedPreset[]> {
  const rows = await prisma.themePreset.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, theme: safeParseTheme(r.config) }));
}

export function parseGenres(genres: string): string[] {
  try {
    const arr = JSON.parse(genres);
    return Array.isArray(arr) ? arr.filter((g) => typeof g === "string") : [];
  } catch {
    return [];
  }
}

export async function getPublicBooks() {
  return prisma.book.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { stories: true } } },
  });
}

export async function getBookBySlug(slug: string) {
  return prisma.book.findUnique({
    where: { slug },
    include: {
      stories: {
        orderBy: { order: "asc" },
        include: { chapters: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export type BookWithStories = NonNullable<Awaited<ReturnType<typeof getBookBySlug>>>;

/** Flatten a book's chapters across its stories in reading order. */
export function flattenChapters(book: BookWithStories) {
  return book.stories.flatMap((story) =>
    story.chapters.map((chapter) => ({ story, chapter })),
  );
}

export async function getChapterForReader(bookSlug: string, chapterSlug: string) {
  const book = await getBookBySlug(bookSlug);
  if (!book) return null;
  const flat = flattenChapters(book);
  const idx = flat.findIndex((f) => f.chapter.slug === chapterSlug);
  if (idx === -1) return null;
  return {
    book,
    story: flat[idx].story,
    chapter: flat[idx].chapter,
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
    position: idx + 1,
    total: flat.length,
  };
}

// ---- Archivist queries ----

export async function getAllBooks() {
  return prisma.book.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { stories: { include: { chapters: true } } },
  });
}

export async function getBookByIdFull(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: {
      stories: {
        orderBy: { order: "asc" },
        include: { chapters: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function getChapterById(id: string) {
  return prisma.chapter.findUnique({
    where: { id },
    include: { story: { include: { book: true } } },
  });
}
