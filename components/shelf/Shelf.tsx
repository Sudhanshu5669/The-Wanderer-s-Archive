"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookCover } from "./BookCover";

export interface ShelfBook {
  slug: string;
  title: string;
  genres: string[];
  coverUrl?: string | null;
  meta: string;
}

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Sudhanshu's Wanderer Archives";

export function Shelf({ books }: { books: ShelfBook[] }) {
  const [active, setActive] = useState("All");

  // Embers use Math.random(), so generate them only after mount — otherwise the
  // server-rendered positions never match the client's and React warns about a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const embers = useMemo(
    () =>
      !mounted
        ? []
        : Array.from({ length: 26 }, (_, i) => {
        const s = Math.random() * 2 + 0.5;
        return {
          id: i,
          style: {
            position: "absolute" as const,
            left: `${(Math.random() * 100).toFixed(1)}%`,
            top: `${(Math.random() * 100).toFixed(1)}%`,
            width: s.toFixed(1) + "px",
            height: s.toFixed(1) + "px",
            borderRadius: "50%",
            background: "rgba(201,168,107,.7)",
            boxShadow: `0 0 ${(s * 3).toFixed(1)}px rgba(201,168,107,.5)`,
            opacity: (0.1 + Math.random() * 0.35).toFixed(2),
            animation: `shelfEmber ${(16 + Math.random() * 20).toFixed(1)}s ease-in-out ${(-Math.random() * 10).toFixed(1)}s infinite alternate`,
          },
        };
      }),
    [mounted],
  );

  const genreList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genres.forEach((g) => set.add(g)));
    return ["All", ...Array.from(set)];
  }, [books]);

  const shown = active === "All" ? books : books.filter((b) => b.genres.includes(active));

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(130% 90% at 50% -8%, #14151f 0%, #0a0b12 44%, #050509 100%)", fontFamily: "var(--font-spectral), Georgia, serif", color: "#e9e5d8", padding: "0 0 90px" }}>
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {embers.map((e) => (
          <span key={e.id} style={e.style} />
        ))}
      </div>

      {/* masthead */}
      <header style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "clamp(56px,9vw,110px) 24px clamp(30px,5vw,54px)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".46em", textTransform: "uppercase", color: "#c9a86b", marginBottom: 22 }}>A Reading Archive</div>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(40px,8vw,86px)", lineHeight: 1, margin: 0, color: "#f4f0e2", letterSpacing: ".01em" }}>
          Sudhanshu&rsquo;s
          <br />
          <span style={{ fontStyle: "italic", color: "#c9a86b" }}>Wanderer</span> Archive
        </h1>
        <p style={{ maxWidth: "52ch", margin: "26px auto 0", fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "clamp(17px,2.4vw,22px)", lineHeight: 1.6, color: "rgba(233,229,216,.62)" }}>
          Mythology, horror, true crime, and quiet fiction — bound as books, read as books. Each story keeps its own weather.
        </p>
      </header>

      {/* genre rail */}
      {genreList.length > 1 && (
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, padding: "0 24px clamp(38px,6vw,64px)" }}>
          {genreList.map((g) => {
            const on = g === active;
            return (
              <button
                key={g}
                onClick={() => setActive(g)}
                style={{ background: on ? "rgba(201,168,107,.14)" : "transparent", border: `1px solid ${on ? "rgba(201,168,107,.55)" : "rgba(233,229,216,.16)"}`, color: on ? "#e3c88c" : "rgba(233,229,216,.6)", padding: "9px 20px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-spectral), serif", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", transition: "all .3s" }}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      {/* shelf grid */}
      <main style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "0 clamp(20px,5vw,48px)" }}>
        {shown.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(233,229,216,.5)" }}>Nothing on this shelf yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px,44vw),1fr))", gap: "clamp(28px,4vw,56px) clamp(22px,3vw,40px)" }}>
            {shown.map((b, i) => (
              <Link key={b.slug} href={`/book/${b.slug}`} className="shelf-card" style={{ display: "block", textDecoration: "none", animationDelay: `${(i * 0.04).toFixed(2)}s` }}>
                <BookCover className="cover-lift" title={b.title} genre={b.genres[0]} meta={b.meta} coverUrl={b.coverUrl} />
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 19, color: "#eee9da", lineHeight: 1.2 }}>{b.title}</div>
                  <div style={{ fontSize: 11, letterSpacing: ".06em", color: "rgba(233,229,216,.45)", marginTop: 4 }}>{b.meta}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
