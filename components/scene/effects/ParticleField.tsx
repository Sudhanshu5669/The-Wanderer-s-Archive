"use client";

import { useEffect, useRef } from "react";

export type ParticleKind = "star" | "ember" | "snow" | "rain";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  tw: number; // twinkle phase
}

interface Props {
  kind: ParticleKind;
  intensity?: number; // 0..1
  color?: string;
}

const KIND_COLOR: Record<ParticleKind, string> = {
  star: "#ffffff",
  ember: "#ff7a2f",
  snow: "#ffffff",
  rain: "#bcd3ff",
};

export default function ParticleField({ kind, intensity = 0.7, color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    const paintColor = color ?? KIND_COLOR[kind];

    function density() {
      // particle count scales with area and intensity
      const area = (w * h) / (dpr * dpr);
      const base =
        kind === "star" ? 9000 : kind === "ember" ? 16000 : kind === "snow" ? 12000 : 7000;
      return Math.max(12, Math.floor((area / base) * (0.4 + intensity)));
    }

    function makeParticle(initial: boolean): Particle {
      const maxLife = 120 + Math.random() * 240;
      if (kind === "star") {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          r: (Math.random() * 1.3 + 0.4) * dpr,
          life: 0,
          maxLife,
          tw: Math.random() * Math.PI * 2,
        };
      }
      if (kind === "ember") {
        return {
          x: Math.random() * w,
          y: initial ? Math.random() * h : h + 10 * dpr,
          vx: (Math.random() - 0.5) * 0.3 * dpr,
          vy: -(0.3 + Math.random() * 0.8) * dpr * (0.6 + intensity),
          r: (Math.random() * 1.6 + 0.6) * dpr,
          life: 0,
          maxLife,
          tw: Math.random() * Math.PI * 2,
        };
      }
      if (kind === "snow") {
        return {
          x: Math.random() * w,
          y: initial ? Math.random() * h : -10 * dpr,
          vx: (Math.random() - 0.5) * 0.4 * dpr,
          vy: (0.4 + Math.random() * 0.7) * dpr,
          r: (Math.random() * 2 + 0.8) * dpr,
          life: 0,
          maxLife,
          tw: Math.random() * Math.PI * 2,
        };
      }
      // rain
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20 * dpr,
        vx: 1.2 * dpr,
        vy: (7 + Math.random() * 5) * dpr,
        r: (Math.random() * 0.6 + 0.4) * dpr,
        life: 0,
        maxLife,
        tw: 0,
      };
    }

    function reset() {
      const rect = canvas!.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width * dpr));
      h = Math.max(1, Math.floor(rect.height * dpr));
      canvas!.width = w;
      canvas!.height = h;
      particles = Array.from({ length: density() }, () => makeParticle(true));
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = kind === "ember" ? "lighter" : "source-over";

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        if (kind === "star") {
          p.tw += 0.03;
          const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(p.tw));
          ctx.beginPath();
          ctx.fillStyle = withAlpha(paintColor, a * (0.6 + intensity * 0.5));
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        if (kind === "rain") {
          ctx.strokeStyle = withAlpha(paintColor, 0.35);
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.stroke();
          if (p.y > h + 20 * dpr) Object.assign(p, makeParticle(false));
          continue;
        }

        // ember / snow — soft dots
        const lifeRatio = p.life / p.maxLife;
        const fade = kind === "ember" ? Math.max(0, 1 - lifeRatio) : 0.85;
        ctx.beginPath();
        ctx.fillStyle = withAlpha(paintColor, fade * (kind === "ember" ? 0.9 : 0.7));
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        const gone =
          (kind === "ember" && (p.y < -10 * dpr || lifeRatio >= 1)) ||
          (kind === "snow" && p.y > h + 10 * dpr);
        if (gone) Object.assign(p, makeParticle(false));
      }
      raf = requestAnimationFrame(draw);
    }

    reset();
    if (reduce) {
      // static frame only
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => reset());
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [kind, intensity, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

function withAlpha(color: string, a: number): string {
  const clamped = Math.max(0, Math.min(1, a));
  if (color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${clamped})`;
  }
  return color;
}
