import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookByIdFull, parseGenres } from "@/lib/queries";
import { ImageField } from "@/components/archivist/ImageField";
import {
  updateBook,
  createChapter,
  updateChapterMeta,
  deleteChapter,
  moveChapter,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function BookSettingsPage({ params }: PageProps<"/archivist/book/[id]">) {
  const { id } = await params;
  const book = await getBookByIdFull(id);
  if (!book) notFound();

  const genres = parseGenres(book.genres);

  return (
    <main className="site-container" style={{ padding: "2rem 1.25rem 5rem", maxWidth: "56rem" }}>
      <Link href="/archivist" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
        ← All books
      </Link>

      {/* Book metadata */}
      <form
        action={updateBook}
        style={{
          marginTop: "1rem",
          padding: "1.25rem",
          border: "1px solid var(--line)",
          borderRadius: "0.75rem",
          background: "rgba(0,0,0,0.2)",
          display: "grid",
          gap: "1rem",
        }}
      >
        <input type="hidden" name="bookId" value={book.id} />
        <h1 className="display" style={{ margin: 0, color: "var(--gold-soft)", fontSize: "1.4rem" }}>
          Book Settings
        </h1>
        <div>
          <label className="lbl" htmlFor="btitle">Title</label>
          <input id="btitle" name="title" className="field" defaultValue={book.title} required />
        </div>
        <div>
          <label className="lbl" htmlFor="blurb">Blurb</label>
          <textarea id="blurb" name="blurb" className="field" rows={3} defaultValue={book.blurb} />
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label className="lbl" htmlFor="genres">Genres (comma-separated)</label>
            <input id="genres" name="genres" className="field" defaultValue={genres.join(", ")} placeholder="Mythology, Horror" />
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <label className="lbl" htmlFor="btype">Type</label>
            <select id="btype" name="type" className="field" defaultValue={book.type}>
              <option value="SINGLE">Single book</option>
              <option value="COLLECTION">Collection</option>
            </select>
          </div>
        </div>
        <ImageField name="coverUrl" label="Cover art" defaultValue={book.coverUrl} />
        <div>
          <button type="submit" className="btn btn-primary">Save book</button>
        </div>
      </form>

      {/* Chapters */}
      <section style={{ marginTop: "2rem" }}>
        <h2 className="display" style={{ color: "var(--ink-dim)", fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Chapters
        </h2>

        {book.stories.map((story) => (
          <div key={story.id} style={{ marginTop: "1rem" }}>
            {book.type === "COLLECTION" && (
              <h3 className="display" style={{ color: "var(--gold)", fontSize: "1.05rem" }}>{story.title}</h3>
            )}

            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.6rem" }}>
              {story.chapters.map((chapter, i) => (
                <li
                  key={chapter.id}
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: "0.7rem 0.85rem",
                    border: "1px solid var(--line)",
                    borderRadius: "0.6rem",
                    background: "rgba(0,0,0,0.18)",
                  }}
                >
                  <span style={{ color: "var(--gold)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <form action={updateChapterMeta} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: "1 1 260px" }}>
                    <input type="hidden" name="chapterId" value={chapter.id} />
                    <input type="hidden" name="bookId" value={book.id} />
                    <input name="title" className="field" defaultValue={chapter.title} style={{ flex: 1 }} />
                    <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      <input type="checkbox" name="showInIndex" defaultChecked={chapter.showInIndex} />
                      in index
                    </label>
                    <button type="submit" className="btn" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>Save</button>
                  </form>

                  <div style={{ display: "flex", gap: "0.35rem", marginLeft: "auto" }}>
                    <Link href={`/archivist/book/${book.id}/chapter/${chapter.id}`} className="btn btn-primary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
                      ✎ Write
                    </Link>
                    <form action={moveChapter}>
                      <input type="hidden" name="chapterId" value={chapter.id} />
                      <input type="hidden" name="bookId" value={book.id} />
                      <input type="hidden" name="dir" value="-1" />
                      <button className="btn" style={{ padding: "0.3rem 0.55rem" }} disabled={i === 0} title="Move up">↑</button>
                    </form>
                    <form action={moveChapter}>
                      <input type="hidden" name="chapterId" value={chapter.id} />
                      <input type="hidden" name="bookId" value={book.id} />
                      <input type="hidden" name="dir" value="1" />
                      <button className="btn" style={{ padding: "0.3rem 0.55rem" }} disabled={i === story.chapters.length - 1} title="Move down">↓</button>
                    </form>
                    <form action={deleteChapter}>
                      <input type="hidden" name="chapterId" value={chapter.id} />
                      <input type="hidden" name="bookId" value={book.id} />
                      <button className="btn btn-danger" style={{ padding: "0.3rem 0.55rem" }} title="Delete chapter">✕</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            <form action={createChapter} style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
              <input type="hidden" name="bookId" value={book.id} />
              <input type="hidden" name="storyId" value={story.id} />
              <input name="title" className="field" placeholder="New chapter title" style={{ maxWidth: 320 }} required />
              <button type="submit" className="btn">+ Add chapter</button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
