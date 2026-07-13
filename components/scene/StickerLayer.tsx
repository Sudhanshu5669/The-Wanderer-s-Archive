"use client";

import type { CSSProperties } from "react";
import type { Sticker } from "@/lib/theme";

// Decorative overlays (blood, stars, seals, etc.) anchored to the page frame by
// relative position, so they stay put regardless of text reflow.
export function StickerLayer({ stickers }: { stickers?: Sticker[] }) {
  if (!stickers || stickers.length === 0) return null;
  return (
    <div className="sticker-layer" aria-hidden>
      {stickers.map((s) => {
        const base: CSSProperties = {
          position: "absolute",
          left: `${s.x * 100}%`,
          top: `${s.y * 100}%`,
          transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
          opacity: s.opacity,
          mixBlendMode: (s.blend as CSSProperties["mixBlendMode"]) || "normal",
          pointerEvents: "none",
        };
        if (s.glyph) {
          return (
            <span
              key={s.id}
              style={{
                ...base,
                fontSize: `${s.size ?? 28}px`,
                color: s.color ?? "#c9a86b",
                lineHeight: 1,
                textShadow: s.glow ? `0 0 12px ${s.color ?? "#c9a86b"}` : "none",
              }}
            >
              {s.glyph}
            </span>
          );
        }
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={s.id} src={s.url} alt="" style={{ ...base, maxWidth: "45%", height: "auto" }} />;
      })}
    </div>
  );
}
