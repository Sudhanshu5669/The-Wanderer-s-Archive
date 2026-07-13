"use client";

import type { EffectKind } from "@/lib/theme";
import ParticleField from "./ParticleField";
import { LightRays, Fog, BurningInk } from "./CssEffects";

// The ambient-effect registry. Adding a new mood = adding one entry here.
export function SceneEffects({
  effect,
  intensity = 0.7,
}: {
  effect: EffectKind;
  intensity?: number;
}) {
  switch (effect) {
    case "starfield":
      return <ParticleField kind="star" intensity={intensity} />;
    case "embers":
      return <ParticleField kind="ember" intensity={intensity} />;
    case "burning-ink":
      return <BurningInk intensity={intensity} />;
    case "snow":
      return <ParticleField kind="snow" intensity={intensity} />;
    case "rain":
      return <ParticleField kind="rain" intensity={intensity} />;
    case "light-rays":
      return <LightRays intensity={intensity} />;
    case "fog":
      return <Fog intensity={intensity} />;
    case "none":
    default:
      return null;
  }
}

export const EFFECT_OPTIONS: { key: EffectKind; label: string }[] = [
  { key: "none", label: "None" },
  { key: "starfield", label: "Starfield ✦" },
  { key: "burning-ink", label: "Burning Ink 🔥" },
  { key: "embers", label: "Embers" },
  { key: "light-rays", label: "Light Rays ☀" },
  { key: "snow", label: "Snow ❄" },
  { key: "rain", label: "Rain ☔" },
  { key: "fog", label: "Fog 🌫" },
];
