"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify, uniqueSlug } from "@/lib/slug";

async function assertArchivist() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

function refreshPublic() {
  revalidatePath("/");
  revalidatePath("/archivist");
}

// ---- Books ----

export async function createBook(formData: FormData) {
  await assertArchivist();
  const title = String(formData.get("title") ?? "").trim() || "Untitled Book";
  const type = String(formData.get("type") ?? "SINGLE") === "COLLECTION" ? "COLLECTION" : "SINGLE";
  const slug = await uniqueSlug(title, async (s) => !!(await prisma.book.findUnique({ where: { slug: s } })));
  const count = await prisma.book.count();

  const book = await prisma.book.create({
    data: {
      title,
      slug,
      type,
      visibility: "DRAFT",
      order: count,
      stories: {
        create: { title, slug: "main", order: 0 },
      },
    },
  });
  refreshPublic();
  redirect(`/archivist/book/${book.id}`);
}

export async function updateBook(formData: FormData) {
  await assertArchivist();
  const id = String(formData.get("bookId"));
  const title = String(formData.get("title") ?? "").trim() || "Untitled Book";
  const blurb = String(formData.get("blurb") ?? "");
  const type = String(formData.get("type") ?? "SINGLE") === "COLLECTION" ? "COLLECTION" : "SINGLE";
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;
  const genres = String(formData.get("genres") ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  await prisma.book.update({
    where: { id },
    data: { title, blurb, type, coverUrl, genres: JSON.stringify(genres) },
  });
  refreshPublic();
  revalidatePath(`/archivist/book/${id}`);
}

export async function setVisibility(formData: FormData) {
  await assertArchivist();
  const id = String(formData.get("bookId"));
  const raw = String(formData.get("visibility"));
  const visibility = ["PUBLIC", "HIDDEN", "DRAFT"].includes(raw) ? raw : "DRAFT";
  await prisma.book.update({ where: { id }, data: { visibility } });
  refreshPublic();
  revalidatePath(`/archivist/book/${id}`);
}

export async function deleteBook(formData: FormData) {
  await assertArchivist();
  const id = String(formData.get("bookId"));
  await prisma.book.delete({ where: { id } });
  refreshPublic();
  redirect("/archivist");
}

// ---- Chapters ----

export async function createChapter(formData: FormData) {
  await assertArchivist();
  const bookId = String(formData.get("bookId"));
  const requestedStoryId = String(formData.get("storyId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "New Chapter";

  const story = requestedStoryId
    ? await prisma.story.findUnique({ where: { id: requestedStoryId } })
    : await prisma.story.findFirst({ where: { bookId }, orderBy: { order: "asc" } });
  if (!story) throw new Error("Story not found");

  const slug = await uniqueSlug(title, async (s) =>
    !!(await prisma.chapter.findFirst({ where: { storyId: story.id, slug: s } })),
  );
  const count = await prisma.chapter.count({ where: { storyId: story.id } });
  const chapter = await prisma.chapter.create({
    data: { storyId: story.id, title, slug, order: count },
  });
  revalidatePath(`/archivist/book/${bookId}`);
  redirect(`/archivist/book/${bookId}/chapter/${chapter.id}`);
}

export async function updateChapterMeta(formData: FormData) {
  await assertArchivist();
  const chapterId = String(formData.get("chapterId"));
  const bookId = String(formData.get("bookId"));
  const title = String(formData.get("title") ?? "").trim() || "Untitled Chapter";
  const showInIndex = formData.get("showInIndex") === "on";
  await prisma.chapter.update({ where: { id: chapterId }, data: { title, showInIndex } });
  revalidatePath(`/archivist/book/${bookId}`);
}

export async function deleteChapter(formData: FormData) {
  await assertArchivist();
  const chapterId = String(formData.get("chapterId"));
  const bookId = String(formData.get("bookId"));
  await prisma.chapter.delete({ where: { id: chapterId } });
  revalidatePath(`/archivist/book/${bookId}`);
}

export async function moveChapter(formData: FormData) {
  await assertArchivist();
  const chapterId = String(formData.get("chapterId"));
  const bookId = String(formData.get("bookId"));
  const dir = Number(formData.get("dir")) < 0 ? -1 : 1;

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) return;
  const siblings = await prisma.chapter.findMany({
    where: { storyId: chapter.storyId },
    orderBy: { order: "asc" },
  });
  const idx = siblings.findIndex((c) => c.id === chapterId);
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;

  const a = siblings[idx];
  const b = siblings[swapIdx];
  await prisma.$transaction([
    prisma.chapter.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.chapter.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidatePath(`/archivist/book/${bookId}`);
}

/** Editor autosave — persists the full scene document + chapter title. */
export async function saveChapter(chapterId: string, content: string, title?: string) {
  await assertArchivist();
  await prisma.chapter.update({
    where: { id: chapterId },
    data: { content, ...(title !== undefined ? { title } : {}) },
  });
  return { ok: true };
}

// ---- Custom theme presets ----

/** Save a scene's theme as a reusable named preset. Returns the new preset. */
export async function saveThemePreset(name: string, config: string) {
  await assertArchivist();
  const clean = name.trim().slice(0, 60) || "Untitled preset";
  const preset = await prisma.themePreset.create({ data: { name: clean, config } });
  return { id: preset.id, name: preset.name };
}

export async function deleteThemePreset(id: string) {
  await assertArchivist();
  await prisma.themePreset.delete({ where: { id } });
  return { ok: true };
}
