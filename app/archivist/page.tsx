import Link from "next/link";
import { getAllBooks, parseGenres } from "@/lib/queries";
import { BookCover } from "@/components/shelf/BookCover";
import { createBook, setVisibility, deleteBook } from "./actions";

export const dynamic = "force-dynamic";

const VIS = ["PUBLIC", "HIDDEN", "DRAFT"] as const;

export default async function ArchivistDashboard() {
  const books = await getAllBooks();

  return (
    <main className="site-container" style={{ padding: "2.5rem 1.25rem 5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="display" style={{ color: "var(--gold-soft)", fontSize: "1.8rem", margin: 0 }}>
          Your Books
        </h1>
      </div>

      {/* New book */}
      <form
        action={createBook}
        style={{
          display: "flex",
          gap: "0.6rem",
          flexWrap: "wrap",
          alignItems: "end",
          marginTop: "1.5rem",
          padding: "1rem",
          border: "1px solid var(--line)",
          borderRadius: "0.75rem",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ flex: "1 1 220px" }}>
          <label className="lbl" htmlFor="title">New book title</label>
          <input id="title" name="title" className="field" placeholder="The Shadow of Elysium" required />
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <label className="lbl" htmlFor="type">Type</label>
          <select id="type" name="type" className="field" defaultValue="SINGLE">
            <option value="SINGLE">Single book</option>
            <option value="COLLECTION">Collection</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          + Create
        </button>
      </form>

      {books.length === 0 ? (
        <p style={{ color: "var(--muted)", marginTop: "2rem" }}>No books yet — create your first above.</p>
      ) : (
        <section
          style={{
            marginTop: "2rem",
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          }}
        >
          {books.map((book) => {
            const genres = parseGenres(book.genres);
            const chapterCount = book.stories.reduce((n, s) => n + s.chapters.length, 0);
            return (
              <div
                key={book.id}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem",
                  border: "1px solid var(--line)",
                  borderRadius: "0.75rem",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                <Link href={`/archivist/book/${book.id}`} style={{ flex: "0 0 84px" }}>
                  <BookCover title={book.title} coverUrl={book.coverUrl} genre={genres[0]} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/archivist/book/${book.id}`}>
                    <h2 className="display" style={{ margin: 0, fontSize: "1.15rem", color: "var(--ink)" }}>
                      {book.title}
                    </h2>
                  </Link>
                  <p style={{ margin: "0.25rem 0 0.6rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                    {book.type === "COLLECTION" ? "Collection" : "Single"} · {chapterCount} chapter
                    {chapterCount === 1 ? "" : "s"}
                  </p>

                  {/* Visibility toggle */}
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {VIS.map((v) => (
                      <form key={v} action={setVisibility}>
                        <input type="hidden" name="bookId" value={book.id} />
                        <input type="hidden" name="visibility" value={v} />
                        <button
                          type="submit"
                          className="tag"
                          style={{
                            cursor: "pointer",
                            background: book.visibility === v ? "rgba(201,162,75,0.18)" : "transparent",
                            borderColor: book.visibility === v ? "var(--gold)" : "var(--line)",
                            color: book.visibility === v ? "var(--gold-soft)" : "var(--ink-dim)",
                          }}
                        >
                          {v === "PUBLIC" ? "● Public" : v === "HIDDEN" ? "◐ Hidden" : "○ Draft"}
                        </button>
                      </form>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.7rem" }}>
                    <Link href={`/archivist/book/${book.id}`} className="btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
                      Edit
                    </Link>
                    {book.visibility === "PUBLIC" && (
                      <Link href={`/book/${book.slug}`} className="btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
                        View
                      </Link>
                    )}
                    <form action={deleteBook} style={{ marginLeft: "auto" }}>
                      <input type="hidden" name="bookId" value={book.id} />
                      <button type="submit" className="btn btn-danger" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
