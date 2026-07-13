"use client";

import { useState } from "react";
import {
  type SceneTheme,
  type SavedPreset,
  type BackgroundKind,
  type EdgeFade,
  type InkFilter,
  type TextAlign,
  THEME_PRESETS,
  presetByKey,
} from "@/lib/theme";
import { FONT_REGISTRY } from "@/lib/font-registry";
import { EFFECT_OPTIONS } from "@/components/scene/effects";
import { randomId } from "@/lib/content";

export function SceneInspector({
  theme,
  onChange,
  customPresets = [],
  onSavePreset,
  onDeletePreset,
}: {
  theme: SceneTheme;
  onChange: (t: SceneTheme) => void;
  customPresets?: SavedPreset[];
  onSavePreset?: (name: string) => void | Promise<void>;
  onDeletePreset?: (id: string) => void;
}) {
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const set = (patch: Partial<SceneTheme>) => onChange({ ...theme, ...patch });
  const setBg = (patch: Partial<SceneTheme["background"]>) =>
    onChange({ ...theme, background: { ...theme.background, ...patch } });
  const setInk = (patch: Partial<SceneTheme["ink"]>) =>
    onChange({ ...theme, ink: { ...theme.ink, ...patch } });

  async function uploadTo(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.url ?? null;
  }

  return (
    <div style={{ display: "grid", gap: "1.1rem" }}>
      {/* Presets */}
      <Section title="Preset">
        <select
          className="field"
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            if (v.startsWith("custom:")) {
              const p = customPresets.find((x) => x.id === v.slice(7));
              if (p) onChange(structuredClone(p.theme));
            } else {
              onChange({ ...presetByKey(v) });
            }
          }}
        >
          <option value="">Apply a preset…</option>
          <optgroup label="Built-in">
            {THEME_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </optgroup>
          {customPresets.length > 0 && (
            <optgroup label="My presets">
              {customPresets.map((p) => (
                <option key={p.id} value={`custom:${p.id}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Save current look as a named preset */}
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <input
            className="field"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Name this look…"
          />
          <button
            className="btn"
            disabled={savingPreset || !presetName.trim() || !onSavePreset}
            onClick={async () => {
              if (!onSavePreset || !presetName.trim()) return;
              setSavingPreset(true);
              try {
                await onSavePreset(presetName.trim());
                setPresetName("");
              } finally {
                setSavingPreset(false);
              }
            }}
          >
            {savingPreset ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Manage saved presets */}
        {customPresets.length > 0 && (
          <div style={{ display: "grid", gap: "0.3rem" }}>
            {customPresets.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <button
                  className="btn"
                  style={{ flex: 1, justifyContent: "flex-start", padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}
                  onClick={() => onChange(structuredClone(p.theme))}
                  title="Apply this preset"
                >
                  ✦ {p.name}
                </button>
                {onDeletePreset && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: "0.2rem 0.45rem", fontSize: "0.75rem" }}
                    onClick={() => onDeletePreset(p.id)}
                    title="Delete preset"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Background */}
      <Section title="Background">
        <Row label="Kind">
          <select
            className="field"
            value={theme.background.kind}
            onChange={(e) => setBg({ kind: e.target.value as BackgroundKind })}
          >
            <option value="solid">Solid color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image</option>
          </select>
        </Row>

        <Row label="Base color">
          <ColorInput value={theme.background.color ?? "#000000"} onChange={(c) => setBg({ color: c })} />
        </Row>

        {theme.background.kind === "gradient" && (
          <Row label="CSS gradient">
            <input
              className="field"
              value={theme.background.gradient ?? ""}
              onChange={(e) => setBg({ gradient: e.target.value })}
              placeholder="linear-gradient(...)"
            />
          </Row>
        )}

        {theme.background.kind === "image" && (
          <>
            <Row label="Image">
              <UploadButton
                label={theme.background.imageUrl ? "Replace" : "Upload"}
                onFile={async (f) => {
                  const url = await uploadTo(f);
                  if (url) setBg({ imageUrl: url });
                }}
              />
            </Row>
            {theme.background.imageUrl && (
              <input
                className="field"
                value={theme.background.imageUrl}
                onChange={(e) => setBg({ imageUrl: e.target.value })}
              />
            )}
            <Row label="Fit">
              <select
                className="field"
                value={theme.background.imageFit ?? "cover"}
                onChange={(e) => setBg({ imageFit: e.target.value as "cover" | "contain" | "tile" })}
              >
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain (photo)</option>
                <option value="tile">Tile</option>
              </select>
            </Row>
            <Row label="Wash color">
              <ColorInput value={theme.background.overlayColor ?? "#000000"} onChange={(c) => setBg({ overlayColor: c })} />
            </Row>
            <Range label="Wash opacity" min={0} max={1} step={0.05} value={theme.background.overlayOpacity ?? 0} onChange={(v) => setBg({ overlayOpacity: v })} />
          </>
        )}
      </Section>

      {/* Edge fade */}
      <Section title="Edge fade (how the page meets its world)">
        <Row label="Style">
          <select className="field" value={theme.edgeFade} onChange={(e) => set({ edgeFade: e.target.value as EdgeFade })}>
            <option value="none">None (hard edge)</option>
            <option value="vignette">Vignette</option>
            <option value="fade-to-color">Fade to color</option>
            <option value="burn">Burn (charred)</option>
          </select>
        </Row>
        <Row label="Fade color">
          <ColorInput value={theme.edgeFadeColor ?? "#000000"} onChange={(c) => set({ edgeFadeColor: c })} />
        </Row>
        <Range label="Vignette strength" min={0} max={1} step={0.05} value={theme.vignetteStrength ?? 0.35} onChange={(v) => set({ vignetteStrength: v })} />
      </Section>

      {/* Ink */}
      <Section title="Ink (the text)">
        <Row label="Color">
          <ColorInput value={theme.ink.color} onChange={(c) => setInk({ color: c })} />
        </Row>
        <Row label="Font">
          <select className="field" value={theme.ink.fontKey} onChange={(e) => setInk({ fontKey: e.target.value })}>
            {FONT_REGISTRY.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </Row>
        <Range label="Size" min={0.75} max={1.6} step={0.01} value={theme.ink.fontSize} onChange={(v) => setInk({ fontSize: v })} />
        <Range label="Line height" min={1.2} max={2.2} step={0.05} value={theme.ink.lineHeight ?? 1.75} onChange={(v) => setInk({ lineHeight: v })} />
        <Range label="Weight" min={300} max={800} step={100} value={theme.ink.weight ?? 400} onChange={(v) => setInk({ weight: v })} />
        <Row label="Align">
          <select className="field" value={theme.ink.align ?? "justify"} onChange={(e) => setInk({ align: e.target.value as TextAlign })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="justify">Justify</option>
          </select>
        </Row>
        <Row label="Effect on ink">
          <select className="field" value={theme.ink.filter} onChange={(e) => setInk({ filter: e.target.value as InkFilter })}>
            <option value="none">None</option>
            <option value="burning">Burning (heat shimmer)</option>
            <option value="glow">Glow</option>
            <option value="bw">Black &amp; white (hard)</option>
          </select>
        </Row>
      </Section>

      {/* Ambient effect */}
      <Section title="Ambient effect">
        <Row label="Effect">
          <select className="field" value={theme.effect} onChange={(e) => set({ effect: e.target.value as SceneTheme["effect"] })}>
            {EFFECT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>
        <Range label="Intensity" min={0} max={1} step={0.05} value={theme.effectIntensity ?? 0.7} onChange={(v) => set({ effectIntensity: v })} />
        <Row label="Enter as">
          <select className="field" value={theme.transition ?? "fade"} onChange={(e) => set({ transition: e.target.value as SceneTheme["transition"] })}>
            <option value="none">None</option>
            <option value="fade">Fade</option>
            <option value="wipe">Wipe</option>
          </select>
        </Row>
      </Section>

      {/* Stickers */}
      <Section title="Stickers (overlays)">
        <UploadButton
          label="+ Add sticker"
          onFile={async (f) => {
            const url = await uploadTo(f);
            if (!url) return;
            const stickers = [
              ...(theme.stickers ?? []),
              { id: randomId(), url, x: 0.5, y: 0.5, scale: 0.4, rotation: 0, opacity: 1 },
            ];
            set({ stickers });
          }}
        />
        {(theme.stickers ?? []).map((s, i) => (
          <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "0.6rem", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Sticker {i + 1}</span>
              <button
                className="btn btn-danger"
                style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem" }}
                onClick={() => set({ stickers: (theme.stickers ?? []).filter((x) => x.id !== s.id) })}
              >
                remove
              </button>
            </div>
            {(["x", "y", "scale", "rotation", "opacity"] as const).map((key) => {
              const cfg = {
                x: { min: 0, max: 1, step: 0.01 },
                y: { min: 0, max: 1, step: 0.01 },
                scale: { min: 0.1, max: 2, step: 0.05 },
                rotation: { min: -180, max: 180, step: 1 },
                opacity: { min: 0, max: 1, step: 0.05 },
              }[key];
              return (
                <Range
                  key={key}
                  label={key}
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={s[key]}
                  onChange={(v) =>
                    set({
                      stickers: (theme.stickers ?? []).map((x) => (x.id === s.id ? { ...x, [key]: v } : x)),
                    })
                  }
                />
              );
            })}
          </div>
        ))}
      </Section>
    </div>
  );
}

// ---- Small UI primitives ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--gold)",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "5.5rem 1fr", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "5.5rem 1fr 2.6rem", gap: "0.5rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span style={{ fontSize: "0.7rem", color: "var(--ink-dim)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </label>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      <input type="color" value={toHex(value)} onChange={(e) => onChange(e.target.value)} style={{ width: 34, height: 30, padding: 0, border: "1px solid var(--line)", borderRadius: 6, background: "transparent" }} />
      <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function UploadButton({ label, onFile }: { label: string; onFile: (f: File) => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className="btn" style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem", alignSelf: "start" }}>
      {busy ? "Uploading…" : label}
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            await onFile(f);
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

function toHex(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
}
