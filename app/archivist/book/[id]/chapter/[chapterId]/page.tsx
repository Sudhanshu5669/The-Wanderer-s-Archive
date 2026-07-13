import { notFound } from "next/navigation";
import { getChapterById, getThemePresets } from "@/lib/queries";
import { parseChapterContent } from "@/lib/content";
import { ChapterEditor } from "@/components/editor/ChapterEditor";

export const dynamic = "force-dynamic";

export default async function ChapterEditorPage({
  params,
}: PageProps<"/archivist/book/[id]/chapter/[chapterId]">) {
  const { id, chapterId } = await params;
  const chapter = await getChapterById(chapterId);
  if (!chapter || chapter.story.book.id !== id) notFound();

  const { scenes } = parseChapterContent(chapter.content);
  const readerHref = `/book/${chapter.story.book.slug}/${chapter.slug}`;
  const presets = await getThemePresets();

  return (
    <ChapterEditor
      chapterId={chapter.id}
      bookId={id}
      bookTitle={chapter.story.book.title}
      bookVisibility={chapter.story.book.visibility}
      initialTitle={chapter.title}
      initialScenes={scenes}
      readerHref={readerHref}
      initialPresets={presets}
    />
  );
}
