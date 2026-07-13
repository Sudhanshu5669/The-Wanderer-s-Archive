"use client";

import { useMemo } from "react";

export function StarField({ count = 46 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const size = Math.random() * 2 + 0.5;
        return {
          id: i,
          style: {
            position: "absolute" as const,
            left: `${(Math.random() * 100).toFixed(1)}%`,
            top: `${(Math.random() * 100).toFixed(1)}%`,
            width: size.toFixed(1) + "px",
            height: size.toFixed(1) + "px",
            borderRadius: "50%",
            background: "#fdfbf4",
            boxShadow: `0 0 ${(size * 2.5).toFixed(1)}px rgba(253,251,244,.7)`,
            opacity: (0.12 + Math.random() * 0.45).toFixed(2),
            animation: `rdrTwinkle ${(3 + Math.random() * 5).toFixed(1)}s ease-in-out ${(-Math.random() * 8).toFixed(1)}s infinite alternate, rdrStarfloat ${(14 + Math.random() * 18).toFixed(1)}s ease-in-out infinite alternate`,
          },
        };
      }),
    [count],
  );
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <span key={s.id} style={s.style} />
      ))}
    </div>
  );
}
