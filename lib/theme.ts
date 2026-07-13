// The Scene Theme Engine — the single source of truth for how a stretch of
// story looks. The editor and the reader both render from this shape, so what
// Sudhanshu designs is exactly what readers see.

import type { CSSProperties } from "react";

export type BackgroundKind = "solid" | "gradient" | "image";
export type ImageFit = "cover" | "contain" | "tile";
export type EdgeFade = "none" | "vignette" | "fade-to-color" | "burn";
export type InkFilter = "none" | "burning" | "bw" | "glow";
export type EffectKind =
  | "none"
  | "starfield"
  | "burning-ink"
  | "embers"
  | "light-rays"
  | "snow"
  | "rain"
  | "fog";
export type SceneTransition = "none" | "fade" | "wipe";
export type TextAlign = "left" | "center" | "justify";

export interface Sticker {
  id: string;
  /** Image sticker source (mutually exclusive with `glyph`). */
  url?: string;
  /** Glyph sticker (a character like ✹ ✦ • ✤) with its own color + size. */
  glyph?: string;
  color?: string;
  size?: number; // px, for glyph stickers
  glow?: boolean;
  /** Position as a fraction of the page (0..1). */
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blend?: string;
}

export interface SceneBackground {
  kind: BackgroundKind;
  color?: string;
  gradient?: string;
  imageUrl?: string;
  imageFit?: ImageFit;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface SceneInk {
  color: string;
  fontKey: string;
  fontSize: number; // multiplier around a ~1.15rem base
  lineHeight?: number;
  letterSpacing?: number; // em
  weight?: number;
  filter: InkFilter;
  align?: TextAlign;
}

export interface SceneTheme {
  label?: string;
  background: SceneBackground;
  edgeFade: EdgeFade;
  edgeFadeColor?: string;
  ink: SceneInk;
  effect: EffectKind;
  effectIntensity?: number; // 0..1
  transition?: SceneTransition;
  stickers?: Sticker[];
  vignetteStrength?: number; // 0..1
  dropCap?: boolean; // enlarge the first letter of the scene (opt-in, off by default)
  layout?: SceneLayout; // how wide the scene uses the screen (default "column")
}

// How much of the screen a scene fills. "column" is the readable default;
// "wide" and "full" let a scene use the whole screen (per the cinematic design).
export type SceneLayout = "column" | "wide" | "full";

export const SCENE_LAYOUTS: { key: SceneLayout; label: string; note: string }[] = [
  { key: "column", label: "Column", note: "readable width" },
  { key: "wide", label: "Wide", note: "more of the screen" },
  { key: "full", label: "Full", note: "fills the screen" },
];

/** Reading-column pixel width for a layout, given the viewport width. */
export function layoutColumnPx(layout: SceneLayout | undefined, vw: number): number {
  switch (layout) {
    case "wide":
      return Math.min(1040, vw * 0.92);
    case "full":
      return Math.min(1680, vw * 0.96);
    default:
      return Math.min(620, vw * 0.88);
  }
}

/** CSS max-width for the editor stage so it mirrors the reader column. */
export function layoutMaxWidthCss(layout?: SceneLayout): string {
  switch (layout) {
    case "wide":
      return "min(1040px, 96%)";
    case "full":
      return "min(1680px, 98%)";
    default:
      return "min(620px, 100%)";
  }
}

export function defaultTheme(): SceneTheme {
  return {
    label: "Parchment",
    background: {
      kind: "gradient",
      color: "#efe6d2",
      gradient:
        "radial-gradient(120% 120% at 50% 0%, #f6efdd 0%, #ece0c4 55%, #e3d4b3 100%)",
    },
    edgeFade: "vignette",
    edgeFadeColor: "#e3d4b3",
    ink: {
      color: "#2c2416",
      fontKey: "garamond",
      fontSize: 1,
      lineHeight: 1.75,
      letterSpacing: 0,
      weight: 400,
      filter: "none",
      align: "justify",
    },
    effect: "none",
    effectIntensity: 0.6,
    transition: "fade",
    stickers: [],
    vignetteStrength: 0.35,
  };
}

// Named starter presets — exactly the moods Sudhanshu described.
export const THEME_PRESETS: { key: string; label: string; theme: SceneTheme }[] = [
  { key: "parchment", label: "Parchment", theme: defaultTheme() },
  {
    key: "hell",
    label: "Hell (Burning Ink)",
    theme: {
      label: "Hell",
      background: {
        kind: "gradient",
        color: "#1a0503",
        gradient:
          "radial-gradient(120% 120% at 50% -10%, #ff3b12 0%, #a3140b 30%, #4a0a06 65%, #1a0503 100%)",
      },
      edgeFade: "burn",
      edgeFadeColor: "#160402",
      ink: {
        color: "#f7d9b0",
        fontKey: "cinzel",
        fontSize: 1.05,
        lineHeight: 1.8,
        letterSpacing: 0.01,
        weight: 500,
        filter: "burning",
        align: "justify",
      },
      effect: "burning-ink",
      effectIntensity: 0.8,
      transition: "fade",
      stickers: [],
      vignetteStrength: 0.7,
    },
  },
  {
    key: "brutal",
    label: "Brutal (B&W)",
    theme: {
      label: "Brutal B&W",
      background: {
        kind: "gradient",
        color: "#0a0a0a",
        gradient:
          "linear-gradient(180deg, #f4f4f4 0%, #d9d9d9 48%, #111 48%, #050505 100%)",
      },
      edgeFade: "none",
      edgeFadeColor: "#000000",
      ink: {
        color: "#0b0b0b",
        fontKey: "cinzel",
        fontSize: 1.05,
        lineHeight: 1.6,
        letterSpacing: 0.02,
        weight: 700,
        filter: "bw",
        align: "left",
      },
      effect: "none",
      effectIntensity: 0.5,
      transition: "wipe",
      stickers: [],
      vignetteStrength: 0.2,
    },
  },
  {
    key: "heaven",
    label: "Heaven (Golden)",
    theme: {
      label: "Heaven",
      background: {
        kind: "gradient",
        color: "#fff6d8",
        gradient:
          "radial-gradient(120% 120% at 50% 0%, #fffdf3 0%, #ffe9a8 45%, #ffd166 78%, #f6b73c 100%)",
      },
      edgeFade: "fade-to-color",
      edgeFadeColor: "#fff2c6",
      ink: {
        color: "#5a3b12",
        fontKey: "cormorant",
        fontSize: 1.1,
        lineHeight: 1.85,
        letterSpacing: 0.005,
        weight: 500,
        filter: "glow",
        align: "justify",
      },
      effect: "light-rays",
      effectIntensity: 0.7,
      transition: "fade",
      stickers: [],
      vignetteStrength: 0.15,
    },
  },
  {
    key: "night",
    label: "Night (Starfield)",
    theme: {
      label: "Night",
      background: {
        kind: "gradient",
        color: "#05060f",
        gradient:
          "radial-gradient(120% 120% at 50% 10%, #10132b 0%, #080a18 55%, #030309 100%)",
      },
      edgeFade: "vignette",
      edgeFadeColor: "#030309",
      ink: {
        color: "#eef1ff",
        fontKey: "cormorant",
        fontSize: 1.08,
        lineHeight: 1.85,
        letterSpacing: 0.005,
        weight: 400,
        filter: "glow",
        align: "justify",
      },
      effect: "starfield",
      effectIntensity: 0.8,
      transition: "fade",
      stickers: [],
      vignetteStrength: 0.5,
    },
  },
];

export function presetByKey(key: string): SceneTheme {
  return THEME_PRESETS.find((p) => p.key === key)?.theme ?? defaultTheme();
}

/** A preset the archivist saved from a scene they designed. */
export interface SavedPreset {
  id: string;
  name: string;
  theme: SceneTheme;
}

// Merge a partial theme onto the default so older/partial saved scenes stay valid.
export function normalizeTheme(input?: Partial<SceneTheme> | null): SceneTheme {
  const base = defaultTheme();
  if (!input) return base;
  return {
    ...base,
    ...input,
    background: { ...base.background, ...(input.background ?? {}) },
    ink: { ...base.ink, ...(input.ink ?? {}) },
    stickers: input.stickers ?? [],
  };
}

// ---- Style computation (shared by editor + reader) ----

const INK_BASE_REM = 1.15;

/** CSS custom properties + background styles for a scene's outer surface. */
export function sceneSurfaceStyle(theme: SceneTheme): CSSProperties {
  const bg = theme.background;
  let background: string;
  if (bg.kind === "solid") {
    background = bg.color ?? "#000";
  } else if (bg.kind === "gradient") {
    background = bg.gradient ?? bg.color ?? "#000";
  } else {
    // image handled via ::before layer in the component; base color as fallback
    background = bg.color ?? "#000";
  }
  return {
    "--scene-bg-color": bg.color ?? "#000",
    "--scene-fade-color": theme.edgeFadeColor ?? bg.color ?? "#000",
    "--scene-ink": theme.ink.color,
    "--scene-vignette": String(theme.vignetteStrength ?? 0.35),
    background,
  } as CSSProperties;
}

/** Inline style for the text column (ink). */
export function inkStyle(theme: SceneTheme, fontFamily: string): CSSProperties {
  const ink = theme.ink;
  const style: CSSProperties = {
    color: ink.color,
    fontFamily,
    fontSize: `${INK_BASE_REM * (ink.fontSize ?? 1)}rem`,
    lineHeight: ink.lineHeight ?? 1.75,
    letterSpacing: `${ink.letterSpacing ?? 0}em`,
    fontWeight: ink.weight ?? 400,
    textAlign: ink.align ?? "justify",
  };
  if (ink.filter === "bw") {
    style.filter = "grayscale(1) contrast(1.25)";
  } else if (ink.filter === "glow") {
    style.textShadow = `0 0 18px ${hexWithAlpha(ink.color, 0.35)}`;
  }
  // "burning" is animated in CSS (see globals.css .ink-burning)
  return style;
}

/** The CSS for the edge fade overlay layer (returns a background value). */
export function edgeFadeBackground(theme: SceneTheme): string | null {
  const c = theme.edgeFadeColor ?? theme.background.color ?? "#000";
  const v = theme.vignetteStrength ?? 0.35;
  switch (theme.edgeFade) {
    case "none":
      return null;
    case "vignette":
      return `radial-gradient(130% 120% at 50% 50%, transparent 55%, ${hexWithAlpha(
        c,
        Math.min(1, v + 0.15),
      )} 100%)`;
    case "fade-to-color":
      return `linear-gradient(to bottom, ${c} 0%, transparent 12%, transparent 88%, ${c} 100%), linear-gradient(to right, ${c} 0%, transparent 8%, transparent 92%, ${c} 100%)`;
    case "burn":
      return `radial-gradient(130% 120% at 50% 45%, transparent 45%, ${hexWithAlpha(
        "#2a0a04",
        0.6,
      )} 78%, ${hexWithAlpha("#0d0301", 0.95)} 100%)`;
    default:
      return null;
  }
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function safeParseTheme(json: unknown): SceneTheme {
  if (typeof json === "string") {
    try {
      return normalizeTheme(JSON.parse(json));
    } catch {
      return defaultTheme();
    }
  }
  return normalizeTheme(json as Partial<SceneTheme>);
}
