"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  inkStyle,
  edgeFadeBackground,
  hexWithAlpha,
  type SceneTheme,
} from "@/lib/theme";
import { fontStack } from "@/lib/font-registry";
import { SceneEffects } from "@/components/scene/effects";
import { StickerLayer } from "@/components/scene/StickerLayer";
import type { Scene } from "@/lib/content";

type NavRef = { slug: string; title: string } | null;
type ChapterRef = { slug: string; title: string };

interface Props {
  bookSlug: string;
  bookTitle: string;
  bookBlurb?: string;
  authorName?: string;
  chapterTitle: string;
  chapters: ChapterRef[];
  currentChapterSlug: string;
  scenes: Scene[];
  prev: NavRef;
  next: NavRef;
  position: number;
  total: number;
}

// Book mode is the only reading mode.
export function BookReader(props: Props) {
  return <BookView {...props} />;
}

// ---------------------------------------------------------------------------
// Leaves
// ---------------------------------------------------------------------------
type Leaf =
  | { kind: "title"; theme: SceneTheme }
  | { kind: "content"; theme: SceneTheme; html: string; first: boolean }
  | { kind: "end"; theme: SceneTheme };

interface Dims {
  colW: number;
  colH: number;
  padX: number;
  padY: number;
  pw: number;
  ph: number;
}

// ---------------------------------------------------------------------------
// Book mode — full-bleed cinematic scene reader (imported design)
// ---------------------------------------------------------------------------
function BookView({
  bookSlug,
  bookTitle,
  bookBlurb,
  authorName = "Sudhanshu",
  chapterTitle,
  chapters,
  currentChapterSlug,
  scenes,
  prev,
  next,
  position,
}: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const deskRef = useRef<HTMLDivElement | null>(null);
  const touchX = useRef<number | null>(null);

  const [dims, setDims] = useState<Dims>({ colW: 0, colH: 0, padX: 0, padY: 0, pw: 0, ph: 0 });
  const [leaves, setLeaves] = useState<Leaf[]>([{ kind: "title", theme: scenes[0].theme }]);
  const [current, setCurrent] = useState(0);
  const [ambientPct, setAmbientPct] = useState(100);
  const [showIndex, setShowIndex] = useState(false);

  // Measure the viewport -> derive the centered reading column + content box.
  useEffect(() => {
    const el = deskRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const colW = Math.min(620, r.width * 0.88);
      const colH = Math.min(r.height * 0.84, 880);
      const padX = Math.min(28, Math.max(10, colW * 0.045));
      const padY = Math.min(40, Math.max(30, colW * 0.05));
      setDims({ colW, colH, padX, padY, pw: Math.max(80, colW - padX * 2), ph: Math.max(80, colH - padY * 2) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Continuous scenes: one leaf per scene (no screen-dependent pagination), so
  // the reader renders each scene exactly as the editor shows it. A tall scene
  // scrolls within the book frame; turning happens between scenes.
  useEffect(() => {
    const arr: Leaf[] = [{ kind: "title", theme: scenes[0].theme }];
    scenes.forEach((s, si) =>
      arr.push({ kind: "content", theme: s.theme, html: s.html, first: si === 0 }),
    );
    arr.push({ kind: "end", theme: scenes[scenes.length - 1].theme });
    setLeaves(arr);
    setCurrent((c) => Math.min(c, arr.length - 1));
  }, [scenes]);

  const last = leaves.length - 1;
  const theme = leaves[current]?.theme ?? scenes[0].theme;

  const goNext = useCallback(() => {
    if (current >= last) {
      if (next) router.push(`/book/${bookSlug}/${next.slug}`);
      return;
    }
    setCurrent(current + 1);
  }, [current, last, next, router, bookSlug]);

  const goPrev = useCallback(() => {
    if (current <= 0) {
      if (prev) router.push(`/book/${bookSlug}/${prev.slug}`);
      return;
    }
    setCurrent(current - 1);
  }, [current, prev, router, bookSlug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setShowIndex(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // Derived look from the current scene's theme.
  const light = isLightSurface(theme);
  const accent = sceneAccent(theme, light);
  const ambientIntensity = Math.min(1, (theme.effectIntensity ?? 0.6) * (ambientPct / 100));
  const chromeInk = light ? "#1a1408" : "#e9e5d8";
  const chromeFaint = light ? "rgba(26,20,8,.5)" : "rgba(233,229,216,.5)";
  const chromeTag = light ? "rgba(26,20,8,.7)" : hexWithAlpha(accent, 0.8);

  const pageLabel =
    current === 0 ? "Chapter Opening" : current === last ? "End of Chapter" : `Page ${current} of ${last}`;
  const progress = last > 0 ? (current / last) * 100 : 0;

  const colWrap: React.CSSProperties = { position: "absolute", inset: 0, padding: `${dims.padY}px ${dims.padX}px`, overflowY: "auto", overflowX: "hidden" };
  (colWrap as Record<string, string | number>)["--leaf-accent"] = accent;

  return (
    <div
      ref={deskRef}
      style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#050509", fontFamily: "var(--font-spectral), Georgia, serif" }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -40) goNext();
        else if (dx > 40) goPrev();
        touchX.current = null;
      }}
    >
      {/* full-screen themed background (cross-fades between scenes) */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, background: fullBackground(theme), transition: "background .8s ease" }} />

      {/* scene background image + edge fade */}
      {theme.background.kind === "image" && theme.background.imageUrl && (
        <>
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, backgroundImage: `url(${theme.background.imageUrl})`, backgroundSize: theme.background.imageFit === "tile" ? "auto" : theme.background.imageFit ?? "cover", backgroundRepeat: theme.background.imageFit === "tile" ? "repeat" : "no-repeat", backgroundPosition: "center", opacity: 0.9 }} />
          {edgeFadeBackground(theme) && <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, background: edgeFadeBackground(theme) as string }} />}
        </>
      )}

      {/* ambient particles */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <SceneEffects effect={theme.effect} intensity={ambientIntensity} />
      </div>

      {/* horizon glow */}
      <div aria-hidden style={{ position: "absolute", left: "50%", bottom: "-14vh", transform: "translateX(-50%)", width: "150vw", height: "46vh", zIndex: 1, pointerEvents: "none", background: `radial-gradient(60% 100% at 50% 100%, ${hexWithAlpha(accent, 0.2)} 0%, transparent 70%)`, transition: "background .8s ease", animation: reduce ? undefined : "rdrHorizonBreathe 11s ease-in-out infinite" }} />

      {/* legibility scrims so the chapter title / page nav stay readable on any theme */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 130, zIndex: 20, pointerEvents: "none", background: light ? "linear-gradient(to bottom, rgba(247,244,235,.6), transparent)" : "linear-gradient(to bottom, rgba(4,4,9,.55), transparent)" }} />
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 130, zIndex: 20, pointerEvents: "none", background: light ? "linear-gradient(to top, rgba(247,244,235,.6), transparent)" : "linear-gradient(to top, rgba(4,4,9,.55), transparent)" }} />

      {/* top chrome */}
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "clamp(14px,2.6vw,26px) clamp(16px,4vw,42px)" }}>
        <button onClick={() => setShowIndex(true)} style={{ ...chromeBtn, color: accent }}>
          <span style={{ display: "inline-flex", flexDirection: "column", gap: 3 }}>
            <span style={{ width: 20, height: 1.5, background: "currentColor", display: "block" }} />
            <span style={{ width: 20, height: 1.5, background: "currentColor", display: "block" }} />
            <span style={{ width: 13, height: 1.5, background: "currentColor", display: "block" }} />
          </span>
          Index
        </button>
        <div style={{ textAlign: "center", lineHeight: 1.3, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(15px,1.6vw,19px)", color: chromeInk, letterSpacing: ".06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color .5s" }}>{bookTitle}</div>
          <div style={{ fontSize: 10, letterSpacing: ".34em", textTransform: "uppercase", color: chromeTag, marginTop: 3, transition: "color .5s" }}>{chapterTitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 96, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 9, letterSpacing: ".28em", textTransform: "uppercase", color: chromeFaint }}>Ambient</span>
          <input type="range" min={0} max={150} value={ambientPct} onChange={(e) => setAmbientPct(Number(e.target.value))} style={{ width: 68, accentColor: accent, cursor: "pointer" }} aria-label="Ambient intensity" />
        </div>
      </header>

      {/* reading column */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {dims.colW > 0 && (
          <div style={{ position: "relative", width: dims.colW, height: dims.colH }}>
            <div style={colWrap}>
              <div key={current} style={{ position: "relative", minHeight: "100%" }}>
                <LeafBody leaf={leaves[current]} chapterTitle={chapterTitle} bookTitle={bookTitle} authorName={authorName} bookBlurb={bookBlurb} position={position} next={next} bookSlug={bookSlug} />
                {/* stickers anchored to the reading column (not the viewport), so they
                    stay the same size/spot as the editor and scroll with the text */}
                {leaves[current]?.kind === "content" && <StickerLayer stickers={leaves[current].theme.stickers} />}
              </div>
            </div>
            <div onClick={goPrev} style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "26%", zIndex: 20, cursor: "w-resize" }} />
            <div onClick={goNext} style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "26%", zIndex: 20, cursor: "e-resize" }} />
          </div>
        )}
      </div>

      {/* bottom chrome */}
      <footer style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 clamp(16px,4vw,42px) clamp(16px,3vw,30px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <button onClick={goPrev} style={{ ...arrowBtn, color: chromeFaint }} aria-label="Previous">‹</button>
          <div style={{ fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase", color: chromeFaint, minWidth: 120, textAlign: "center" }}>{pageLabel}</div>
          <button onClick={goNext} style={{ ...arrowBtn, color: chromeFaint }} aria-label="Next">›</button>
        </div>
        <div style={{ width: "min(320px,60vw)", height: 1, background: light ? "rgba(26,20,8,.14)" : "rgba(233,229,216,.12)", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, transparent)`, transition: "width .5s cubic-bezier(.4,0,.2,1), background .8s ease" }} />
        </div>
      </footer>

      {/* index overlay */}
      {showIndex && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
          <div onClick={() => setShowIndex(false)} style={{ position: "absolute", inset: 0, background: "rgba(3,3,7,.72)", backdropFilter: "blur(3px)" }} />
          <aside style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "min(420px,86vw)", background: "linear-gradient(160deg,#0d0e18,#070810)", borderRight: "1px solid rgba(201,168,107,.18)", boxShadow: "40px 0 90px rgba(0,0,0,.6)", padding: "clamp(30px,5vw,56px) clamp(26px,4vw,48px)", overflowY: "auto", animation: reduce ? undefined : "rdrPanelIn .4s cubic-bezier(.4,0,.2,1) both" }}>
            <div style={{ fontSize: 10, letterSpacing: ".4em", textTransform: "uppercase", color: "#c9a86b", marginBottom: 10 }}>The Wanderer Archive</div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(30px,5vw,42px)", color: "#f2eede", margin: "0 0 6px" }}>{bookTitle}</h2>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: 16, color: "rgba(233,229,216,.5)", marginBottom: 34 }}>{authorName}</div>
            <div style={{ width: "100%", height: 1, background: "rgba(201,168,107,.2)", marginBottom: 26 }} />
            <nav style={{ display: "flex", flexDirection: "column" }}>
              {chapters.map((ch) => {
                const live = ch.slug === currentChapterSlug;
                return (
                  <Link key={ch.slug} href={`/book/${bookSlug}/${ch.slug}`} className="rdr-chapter-row" style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid rgba(233,229,216,.07)", width: "100%" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 8, background: live ? accent : "rgba(233,229,216,.25)" }} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(17px,2.6vw,20px)", color: live ? "#f2eede" : "rgba(233,229,216,.6)", lineHeight: 1.2 }}>{ch.title}</span>
                      {live && <span style={{ display: "block", fontSize: 9, letterSpacing: ".24em", textTransform: "uppercase", color: hexWithAlpha(accent, 0.75), marginTop: 4 }}>Now reading</span>}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

function LeafBody({
  leaf,
  chapterTitle,
  bookTitle,
  authorName,
  bookBlurb,
  position,
  next,
  bookSlug,
}: {
  leaf: Leaf | undefined;
  chapterTitle: string;
  bookTitle: string;
  authorName: string;
  bookBlurb?: string;
  position: number;
  next: NavRef;
  bookSlug: string;
}) {
  if (!leaf) return null;
  const ink = inkStyle(leaf.theme, fontStack(leaf.theme.ink.fontKey));
  // Auto-generated chapter/end pages sit over the full-bleed background, so
  // pick a colour guaranteed to contrast with it (independent of the scene ink,
  // which the author may have tuned dark-on-dark for effect).
  const autoInk = isLightSurface(leaf.theme) ? "#1a1408" : "#f4f0e2";

  if (leaf.kind === "title") {
    return (
      <div className="rdr-page-fade" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", color: autoInk }}>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 12, letterSpacing: ".4em", textTransform: "uppercase", color: "var(--leaf-accent)", marginBottom: 22 }}>Chapter {toWords(position)}</div>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontSize: "clamp(34px,6vw,60px)", lineHeight: 1.02, margin: "0 0 20px" }}>{chapterTitle}</h1>
        <div style={{ width: 56, height: 1, background: "linear-gradient(90deg, var(--leaf-accent), transparent)", marginBottom: 24 }} />
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "clamp(16px,2.4vw,20px)", lineHeight: 1.7, opacity: 0.78, margin: 0, maxWidth: "34ch" }}>{bookBlurb || `from ${bookTitle} — ${authorName}`}</p>
      </div>
    );
  }

  if (leaf.kind === "end") {
    return (
      <div className="rdr-page-fade" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", color: autoInk }}>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, color: "var(--leaf-accent)", letterSpacing: ".4em" }}>❦</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: 15, letterSpacing: ".06em", opacity: 0.6, marginTop: 14 }}>end of {chapterTitle.toLowerCase()}</div>
        {next && (
          <Link href={`/book/${bookSlug}/${next.slug}`} style={{ marginTop: 22, fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "var(--leaf-accent)" }}>Next: {next.title} →</Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rdr-page-fade ink leaf-ink${leaf.theme.dropCap ? " rdr-dropcap" : ""}${leaf.theme.ink.filter === "burning" ? " ink-burning" : ""}`}
      style={{ ...ink, minHeight: "100%" }}
      dangerouslySetInnerHTML={{ __html: leaf.html }}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fullBackground(theme: SceneTheme): string {
  const bg = theme.background;
  if (bg.kind === "gradient") return bg.gradient ?? bg.color ?? "#050509";
  return bg.color ?? "#050509";
}

function relLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Average luminance of the scene's background (handles multi-stop gradients). */
function backgroundLuminance(theme: SceneTheme): number {
  const bg = theme.background;
  if (bg.kind === "image") return 0.08; // images are darkened -> treat as dark
  const src = bg.kind === "gradient" ? bg.gradient ?? bg.color ?? "" : bg.color ?? "";
  const hexes = src.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return 0.08;
  return hexes.reduce((a, h) => a + relLuminance(h), 0) / hexes.length;
}

/** A pale BACKGROUND needs dark UI chrome (measured on the bg, not the ink, so
 *  a dark ink on a dark scene doesn't fool the chrome into going invisible). */
function isLightSurface(theme: SceneTheme): boolean {
  return backgroundLuminance(theme) > 0.5;
}

/** Mood-appropriate accent, derived from the scene's ambient effect. */
function sceneAccent(theme: SceneTheme, light: boolean): string {
  if (light) return "#8a5f16";
  switch (theme.effect) {
    case "starfield":
      return "#9fb0d6";
    case "burning-ink":
    case "embers":
      return "#e88b4c";
    case "light-rays":
      return "#f0cf8c";
    case "snow":
    case "rain":
      return "#afc0e0";
    default:
      return "#c9a86b";
  }
}

const chromeBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-spectral), serif",
  fontSize: 11,
  letterSpacing: ".32em",
  textTransform: "uppercase",
  padding: "6px 0",
};
const arrowBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 6 };

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
function toWords(n: number): string {
  return WORDS[n] ?? String(n);
}
