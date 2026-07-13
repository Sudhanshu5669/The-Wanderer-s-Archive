import Link from "next/link";
import { getPublicBooks, parseGenres } from "@/lib/queries";
import { bookMeta } from "@/lib/cover";
import { Shelf, type ShelfBook } from "@/components/shelf/Shelf";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const books = await getPublicBooks();
  const shelfBooks: ShelfBook[] = books.map((b) => ({
    slug: b.slug,
    title: b.title,
    genres: parseGenres(b.genres),
    coverUrl: b.coverUrl,
    meta: bookMeta(b.type, b._count.stories),
  }));

  return (
    <>
      <Link
        href="/archivist"
        style={{ position: "fixed", top: 18, right: 20, zIndex: 40, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "rgba(201,168,107,.7)" }}
      >
        Archivist
      </Link>
      <Shelf books={shelfBooks} />
    </>
  );
}
