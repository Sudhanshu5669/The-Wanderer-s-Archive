import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChapterForReader, flattenChapters } from "@/lib/queries";
import { isArchivist } from "@/lib/auth";
import { parseChapterContent } from "@/lib/content";
import { BookReader } from "@/components/reader/BookReader";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/book/[bookSlug]/[chapterSlug]">): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  const data = await getChapterForReader(bookSlug, chapterSlug);
  if (!data) return { title: "Not found" };
  return { title: `${data.chapter.title} — ${data.book.title}` };
}

export default async function ReaderPage({
  params,
}: PageProps<"/book/[bookSlug]/[chapterSlug]">) {
  const { bookSlug, chapterSlug } = await params;
  const data = await getChapterForReader(bookSlug, chapterSlug);
  if (!data) notFound();

  const admin = await isArchivist();
  if (data.book.visibility !== "PUBLIC" && !admin) notFound();

  const { scenes } = parseChapterContent(data.chapter.content);
  const chapters = flattenChapters(data.book).map(({ chapter }) => ({
    slug: chapter.slug,
    title: chapter.title,
  }));

  return (
    <BookReader
      bookSlug={data.book.slug}
      bookTitle={data.book.title}
      bookBlurb={data.book.blurb}
      authorName="Sudhanshu"
      chapterTitle={data.chapter.title}
      chapters={chapters}
      currentChapterSlug={data.chapter.slug}
      scenes={scenes}
      prev={data.prev ? { slug: data.prev.chapter.slug, title: data.prev.chapter.title } : null}
      next={data.next ? { slug: data.next.chapter.slug, title: data.next.chapter.title } : null}
      position={data.position}
      total={data.total}
    />
  );
}
