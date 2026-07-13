import type { CSSProperties } from "react";
import { moodForGenre } from "@/lib/cover";

// A book spine. Uploaded cover art wins; otherwise a mood-colored spine derived
// from the book's genre (from the imported Shelf design).
export function BookCover({
  title,
  genre,
  meta,
  coverUrl,
  className,
}: {
  title: string;
  genre?: string;
  meta?: string;
  coverUrl?: string | null;
  className?: string;
}) {
  const wrap: CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: "0.66",
    borderRadius: 3,
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(0,0,0,.55), inset 0 0 60px rgba(0,0,0,.35)",
  };

  if (coverUrl) {
    return (
      <div className={className} style={wrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={`Cover of ${title}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 12, background: "linear-gradient(90deg, rgba(0,0,0,.4), transparent)" }} />
      </div>
    );
  }

  const m = moodForGenre(genre);
  return (
    <div className={className} style={{ ...wrap, background: m.bg }}>
      <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 12, background: "linear-gradient(90deg, rgba(0,0,0,.4), transparent)", borderRadius: "3px 0 0 3px" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: m.sheen, pointerEvents: "none", borderRadius: 3 }} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%", padding: "clamp(16px,2vw,22px)" }}>
        {genre && <div style={{ fontSize: 9, letterSpacing: ".32em", textTransform: "uppercase", color: m.tag }}>{genre}</div>}
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(21px,3vw,27px)", fontWeight: 500, lineHeight: 1.08, color: m.ink }}>{title}</div>
        <div style={{ width: 26, height: 1, background: m.rule, margin: "12px 0 10px" }} />
        {meta && <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: m.meta }}>{meta}</div>}
      </div>
    </div>
  );
}
