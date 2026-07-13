import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBookBySlug, flattenChapters, parseGenres } from "@/lib/queries";
import { isArchivist } from "@/lib/auth";
import { moodForGenre } from "@/lib/cover";
import { parseChapterContent } from "@/lib/content";
import { StarField } from "@/components/site/StarField";

export const dynamic = "force-dynamic";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const EFFECT_CHIP: Record<string, string> = {
  starfield: "#8fa0c8",
  "burning-ink": "#e08a5a",
  embers: "#e08a5a",
  "light-rays": "#f0d68f",
  snow: "#6fb7ba",
  rain: "#6fb7ba",
  fog: "#c9a86b",
  none: "#c9a86b",
};

export async function generateMetadata({ params }: PageProps<"/book/[bookSlug]">): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = await getBookBySlug(bookSlug);
  if (!book) return { title: "Not found" };
  return { title: book.title, description: book.blurb || undefined };
}

export default async function BookLandingPage({ params }: PageProps<"/book/[bookSlug]">) {
  const { bookSlug } = await params;
  const book = await getBookBySlug(bookSlug);
  if (!book) notFound();
  const admin = await isArchivist();
  if (book.visibility !== "PUBLIC" && !admin) notFound();

  const genres = parseGenres(book.genres);
  const mood = moodForGenre(genres[0]);
  const flat = flattenChapters(book).filter(({ chapter }) => chapter.showInIndex || admin);
  const firstChapter = flattenChapters(book)[0]?.chapter;

  const chapters = flat.map(({ chapter }) => {
    const scenes = parseChapterContent(chapter.content).scenes;
    const first = scenes[0]?.theme;
    return {
      slug: chapter.slug,
      title: chapter.title,
      moodLabel: first?.label || "Scene",
      chipColor: first ? EFFECT_CHIP[first.effect] ?? "#c9a86b" : "#c9a86b",
      sceneCount: scenes.length,
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(120% 90% at 50% 0%, #12131f 0%, #0a0b12 44%, #050509 100%)", fontFamily: "var(--font-spectral), Georgia, serif", color: "#e9e5d8" }}>
      <StarField count={46} />

      <div style={{ position: "relative", zIndex: 3, padding: "clamp(20px,3vw,32px) clamp(20px,5vw,48px) 0" }}>
        <Link href="/" style={{ fontSize: 11, letterSpacing: ".28em", textTransform: "uppercase", color: "rgba(201,168,107,.85)" }}>‹&nbsp;&nbsp;The Archive</Link>
      </div>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1140, margin: "0 auto", padding: "clamp(28px,5vw,60px) clamp(20px,5vw,48px) 100px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px,100%),1fr))", gap: "clamp(40px,6vw,84px)", alignItems: "start" }}>
        {/* cover column */}
        <div style={{ animation: "shelfFadeUp .7s ease both", position: "sticky", top: 40 }}>
          <div style={{ position: "relative", width: "min(360px,80vw)", margin: "0 auto", aspectRatio: "0.66", borderRadius: "4px 8px 8px 4px", background: mood.bg, boxShadow: "0 34px 70px rgba(0,0,0,.6), inset 0 0 90px rgba(0,0,0,.4)", overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 16, background: "linear-gradient(90deg, rgba(0,0,0,.45), transparent)" }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: mood.sheen }} />
            <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", padding: "clamp(26px,4vw,40px)" }}>
              <div style={{ fontSize: 10, letterSpacing: ".4em", textTransform: "uppercase", color: mood.tag }}>{genres[0] || "Archive"}{book.type === "COLLECTION" ? " · Collection" : ""}</div>
              <div style={{ flex: 1 }} />
              <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(40px,7vw,56px)", lineHeight: 0.98, margin: 0, color: mood.ink }}>{book.title}</h1>
              <div style={{ width: 44, height: 1, background: mood.rule, margin: "18px 0 14px" }} />
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: 17, color: "rgba(233,229,216,.62)" }}>Sudhanshu</div>
            </div>
          </div>
          {firstChapter && (
            <Link href={`/book/${book.slug}/${firstChapter.slug}`} style={{ display: "block", width: "min(360px,80vw)", margin: "26px auto 0", textAlign: "center", background: "linear-gradient(180deg,#c9a86b,#b2915a)", color: "#1a1408", fontFamily: "var(--font-spectral), serif", fontSize: 12, letterSpacing: ".26em", textTransform: "uppercase", padding: 16, borderRadius: 3, boxShadow: "0 12px 30px rgba(201,168,107,.22)" }}>Begin Reading</Link>
          )}
        </div>

        {/* identity + index column */}
        <div style={{ animation: "shelfFadeUp .7s ease .08s both" }}>
          {book.visibility !== "PUBLIC" && <div style={{ fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "#e08a5a", marginBottom: 12 }}>{book.visibility} — visible only to you</div>}
          <div style={{ fontSize: 11, letterSpacing: ".4em", textTransform: "uppercase", color: "#c9a86b", marginBottom: 16 }}>About this book</div>
          {book.blurb && <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(20px,3vw,26px)", fontStyle: "italic", lineHeight: 1.55, color: "rgba(233,229,216,.8)", margin: "0 0 20px", maxWidth: "44ch" }}>{book.blurb}</p>}
          {genres.length > 0 && <p style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(233,229,216,.4)", margin: "0 0 44px" }}>{genres.join(" · ")}</p>}

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid rgba(201,168,107,.25)", paddingBottom: 14, marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 24, color: "#f2eede" }}>Index</div>
            <div style={{ fontSize: 10, letterSpacing: ".26em", textTransform: "uppercase", color: "rgba(233,229,216,.4)" }}>{chapters.length} {chapters.length === 1 ? "chapter" : "chapters"}</div>
          </div>

          <nav>
            {chapters.map((ch, i) => (
              <Link key={ch.slug} href={`/book/${book.slug}/${ch.slug}`} className="index-chapter-row" style={{ display: "flex", gap: 16, alignItems: "flex-start", textDecoration: "none", padding: "20px 0", borderBottom: "1px solid rgba(233,229,216,.08)" }}>
                <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, color: ch.chipColor, minWidth: 34 }}>{ROMAN[i] ?? i + 1}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(20px,3vw,25px)", color: "#eee9da", lineHeight: 1.15 }}>{ch.title}</span>
                    <span style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", color: ch.chipColor, border: `1px solid ${ch.chipColor}55`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{ch.moodLabel}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 11, letterSpacing: ".06em", color: "rgba(233,229,216,.42)", marginTop: 6 }}>{ch.sceneCount} {ch.sceneCount === 1 ? "scene" : "scenes"}</span>
                </span>
                <span style={{ color: "rgba(201,168,107,.6)", fontSize: 18 }}>›</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
