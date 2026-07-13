"use client";

import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import {
  type SceneTheme,
  sceneSurfaceStyle,
  inkStyle,
  edgeFadeBackground,
} from "@/lib/theme";
import { fontStack } from "@/lib/font-registry";
import { SceneEffects } from "./effects";
import { StickerLayer } from "./StickerLayer";

interface Props {
  theme: SceneTheme;
  /** Rendered HTML (reader). Ignored if `children` is provided. */
  html?: string;
  /** Editable content (editor). Takes precedence over `html`. */
  children?: ReactNode;
  className?: string;
  /** Extra class on the ink column (e.g. "leaf-ink" so the editor matches the reader leaf). */
  contentClassName?: string;
  /** Minimum height (vh) — reader scenes feel like full pages; editor is auto. */
  minHeightVh?: number;
}

// The single renderer shared by the editor and the reader. Whatever the editor
// shows here is exactly what a reader sees.
export function SceneRenderer({ theme, html, children, className, contentClassName, minHeightVh }: Props) {
  const surface = sceneSurfaceStyle(theme);
  const fadeBg = edgeFadeBackground(theme);
  const bg = theme.background;
  const ink = inkStyle(theme, fontStack(theme.ink.fontKey));

  const bgImageStyle: CSSProperties | null =
    bg.kind === "image" && bg.imageUrl
      ? {
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: bg.imageFit === "tile" ? "auto" : bg.imageFit ?? "cover",
          backgroundRepeat: bg.imageFit === "tile" ? "repeat" : "no-repeat",
          backgroundPosition: "center",
        }
      : null;

  return (
    <div
      className={clsx("scene-surface", className)}
      style={{ ...surface, minHeight: minHeightVh ? `${minHeightVh}vh` : undefined }}
    >
      {bgImageStyle && <div className="scene-bg-image" style={bgImageStyle} aria-hidden />}
      {bg.kind === "image" && bg.overlayColor && (
        <div
          className="scene-bg-overlay"
          aria-hidden
          style={{ background: bg.overlayColor, opacity: bg.overlayOpacity ?? 0.3 }}
        />
      )}

      <div className="scene-effect-layer" aria-hidden>
        <SceneEffects effect={theme.effect} intensity={theme.effectIntensity ?? 0.7} />
      </div>

      <div className="scene-page">
        <div
          className={clsx("ink", contentClassName, theme.ink.filter === "burning" && "ink-burning")}
          style={ink}
        >
          {children ?? (
            <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
          )}
        </div>
      </div>

      {fadeBg && <div className="scene-edge-fade" aria-hidden style={{ background: fadeBg }} />}

      <StickerLayer stickers={theme.stickers} />
    </div>
  );
}
