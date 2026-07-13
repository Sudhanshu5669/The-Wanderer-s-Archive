"use client";

import type { CSSProperties } from "react";
import ParticleField from "./ParticleField";

type FxStyle = CSSProperties & { "--fx-intensity"?: string };

function fx(intensity: number): FxStyle {
  return { "--fx-intensity": String(intensity) };
}

export function LightRays({ intensity = 0.7 }: { intensity?: number }) {
  return <div className="fx-rays" aria-hidden style={fx(intensity)} />;
}

export function Fog({ intensity = 0.6 }: { intensity?: number }) {
  return <div className="fx-fog" aria-hidden style={fx(intensity)} />;
}

export function BurningInk({ intensity = 0.8 }: { intensity?: number }) {
  return (
    <>
      <ParticleField kind="ember" intensity={intensity} />
      <div className="fx-burn-glow" aria-hidden style={fx(intensity)} />
    </>
  );
}
