"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { SceneRenderer } from "@/components/scene/SceneRenderer";
import { SceneTextEditor, type SceneTextChange } from "./SceneTextEditor";
import { SceneInspector } from "./SceneInspector";
import { defaultTheme, presetByKey, THEME_PRESETS, type SceneTheme, type SavedPreset } from "@/lib/theme";
import { FONT_REGISTRY } from "@/lib/font-registry";
import { EFFECT_OPTIONS } from "@/components/scene/effects";
import { randomId, type Scene } from "@/lib/content";
import { saveChapter, saveThemePreset, deleteThemePreset } from "@/app/archivist/actions";

type SaveState = "idle" | "saving" | "saved" | "error";

const INK_SWATCHES = ["#eef0f6", "#f7e5d2", "#c9a86b", "#8fa0c8", "#e07840", "#111112"];
// Editor stage width — matches the reader's reading column so the editor is a
// true 1:1 mirror (same wrapping, same image size, same layout).
const STAGE_MAX = "min(620px, 100%)";
const panelBtn: React.CSSProperties = { padding: "0.28rem 0.6rem", fontSize: "0.72rem", letterSpacing: ".04em" };
const STICKER_PALETTE = [
  { id: "blood", label: "Blood splatter", glyph: "✹", color: "#a01810", size: 46, glow: true },
  { id: "star", label: "Star", glyph: "✦", color: "#fdfbf4", size: 22, glow: false },
  { id: "ember", label: "Ember", glyph: "•", color: "#ff7a30", size: 20, glow: true },
  { id: "seal", label: "Wax seal", glyph: "✤", color: "#c9a86b", size: 34, glow: false },
];

interface Props {
  chapterId: string;
  bookId: string;
  bookTitle: string;
  bookVisibility: string;
  initialTitle: string;
  initialScenes: Scene[];
  readerHref: string;
  initialPresets: SavedPreset[];
}

export function ChapterEditor({ chapterId, bookId, bookTitle, bookVisibility, initialTitle, initialScenes, readerHref, initialPresets }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [scenes, setScenes] = useState<Scene[]>(initialScenes.length ? initialScenes : [{ id: randomId(), theme: defaultTheme(), html: "<p></p>" }]);
  const [selectedId, setSelectedId] = useState<string>(scenes[0]?.id ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [customPresets, setCustomPresets] = useState<SavedPreset[]>(initialPresets);
  const [tool, setTool] = useState<(typeof STICKER_PALETTE)[number] | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, scenes });
  latest.current = { title, scenes };
  const pageRef = useRef<HTMLDivElement | null>(null);

  const scheduleSave = useCallback(() => {
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await saveChapter(chapterId, JSON.stringify({ scenes: latest.current.scenes }), latest.current.title);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 800);
  }, [chapterId]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0];
  const selIdx = scenes.findIndex((s) => s.id === selected.id);
  const theme = selected.theme;

  function mutateScenes(next: Scene[]) { setScenes(next); scheduleSave(); }
  const onTitle = (v: string) => { setTitle(v); scheduleSave(); };
  const onSceneText = (id: string, c: SceneTextChange) => mutateScenes(scenes.map((s) => (s.id === id ? { ...s, doc: c.doc, html: c.html } : s)));
  const setTheme = (t: SceneTheme) => mutateScenes(scenes.map((s) => (s.id === selected.id ? { ...s, theme: t } : s)));
  const patch = (p: Partial<SceneTheme>) => setTheme({ ...theme, ...p });
  const patchInk = (p: Partial<SceneTheme["ink"]>) => setTheme({ ...theme, ink: { ...theme.ink, ...p } });
  const patchBg = (p: Partial<SceneTheme["background"]>) => setTheme({ ...theme, background: { ...theme.background, ...p } });

  const addScene = () => {
    const ns: Scene = { id: randomId(), theme: defaultTheme(), html: "<p></p>" };
    const next = [...scenes.slice(0, selIdx + 1), ns, ...scenes.slice(selIdx + 1)];
    mutateScenes(next);
    setSelectedId(ns.id);
  };
  const deleteScene = () => {
    if (scenes.length <= 1) return;
    const next = scenes.filter((s) => s.id !== selected.id);
    mutateScenes(next);
    setSelectedId(next[0].id);
  };
  const moveScene = (dir: -1 | 1) => {
    const swap = selIdx + dir;
    if (swap < 0 || swap >= scenes.length) return;
    const next = [...scenes];
    [next[selIdx], next[swap]] = [next[swap], next[selIdx]];
    mutateScenes(next);
  };

  const placeSticker = (e: React.MouseEvent) => {
    if (!tool || !pageRef.current) return;
    const r = pageRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    patch({ stickers: [...(theme.stickers ?? []), { id: randomId(), glyph: tool.glyph, color: tool.color, size: tool.size, glow: tool.glow, x, y, scale: 1, rotation: 0, opacity: 1 }] });
  };

  async function uploadBg(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) patchBg({ kind: "image", imageUrl: data.url });
  }

  // Upload an image and drop it inline in the prose at the cursor.
  async function insertImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url && editor) editor.chain().focus().setImage({ src: data.url }).run();
  }

  // Drag a sticker on the stage -> write back its fractional x/y so it lands in
  // the same relative spot in the reader on every screen.
  const dragSticker = (stickerId: string) => (e: React.PointerEvent) => {
    if (!pageRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = pageRef.current.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
      patch({ stickers: (theme.stickers ?? []).map((s) => (s.id === stickerId ? { ...s, x, y } : s)) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  async function handleSavePreset(name: string) {
    const t: SceneTheme = structuredClone(theme);
    t.label = name;
    const res = await saveThemePreset(name, JSON.stringify(t));
    setCustomPresets((p) => [...p, { id: res.id, name: res.name, theme: t }]);
  }
  // Prominent, discoverable save flow (the current scene's FULL look — mood, ink,
  // font, ambient effect like Rain, stickers — is saved and reusable).
  async function savePresetPrompt() {
    const name = window.prompt("Name this look (saves mood, ink, font, ambient effect & stickers):", theme.label || "");
    if (!name || !name.trim()) return;
    try {
      await handleSavePreset(name.trim());
    } catch (e) {
      alert("Couldn't save preset: " + (e instanceof Error ? e.message : String(e)));
    }
  }
  async function handleDeletePreset(id: string) {
    setCustomPresets((p) => p.filter((x) => x.id !== id));
    try { await deleteThemePreset(id); } catch { /* optimistic */ }
  }

  const ambientPct = Math.round((theme.effectIntensity ?? 0.6) * 100);
  const fadePct = Math.round((theme.vignetteStrength ?? 0.35) * 100);
  const bgOn = theme.background.kind === "image";

  return (
    <div className="atelier">
      {/* LEFT: scene tree (collapsible) */}
      {leftOpen && (
      <aside className="atelier-tree">
        <div style={{ fontSize: 10, letterSpacing: ".4em", textTransform: "uppercase", color: "#c9a86b", marginBottom: 6 }}>The Atelier</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, color: "#f2ead6", lineHeight: 1.1 }}>{bookTitle}</div>
        <div style={{ fontSize: 11, color: "rgba(232,224,205,.42)", marginBottom: 16 }}>{bookVisibility.toLowerCase()} · chapter</div>

        <label className="atelier-lbl" style={{ marginBottom: 6 }}>Chapter title</label>
        <input value={title} onChange={(e) => onTitle(e.target.value)} className="field" style={{ marginBottom: 20, fontFamily: "var(--font-cormorant), serif" }} />

        <div className="atelier-lbl">Scenes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {scenes.map((s, i) => {
            const on = s.id === selected.id;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{ display: "flex", gap: 11, alignItems: "center", width: "100%", textAlign: "left", background: on ? "rgba(201,168,107,.1)" : "transparent", border: "none", borderLeft: `2px solid ${on ? "#c9a86b" : "transparent"}`, padding: "9px 10px", cursor: "pointer", borderRadius: "0 4px 4px 0", color: "inherit" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: on ? "#c9a86b" : "rgba(232,224,205,.25)" }} />
                <span style={{ flex: 1, lineHeight: 1.3 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-cormorant), serif", fontSize: 16, color: on ? "#f2ead6" : "rgba(232,224,205,.62)" }}>Scene {i + 1}</span>
                  <span style={{ display: "block", fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(232,224,205,.35)", marginTop: 2 }}>{s.theme.label || "Untitled mood"}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn" style={{ padding: "0.25rem 0.55rem", fontSize: "0.78rem" }} onClick={addScene}>+ Scene</button>
          <button className="btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem" }} onClick={() => moveScene(-1)} disabled={selIdx === 0}>↑</button>
          <button className="btn" style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem" }} onClick={() => moveScene(1)} disabled={selIdx === scenes.length - 1}>↓</button>
          <button className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem" }} onClick={deleteScene} disabled={scenes.length <= 1}>Delete</button>
        </div>

        <div style={{ flex: 1 }} />
        <Link href={`/archivist/book/${bookId}`} style={{ fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "rgba(201,168,107,.7)", marginTop: 20 }}>‹ Back to the book</Link>
      </aside>
      )}

      {/* CENTER: live manuscript — the stage renders exactly like the reader */}
      <main className="atelier-main">
        <div style={{ width: "100%", maxWidth: STAGE_MAX, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn" style={panelBtn} onClick={() => setLeftOpen((v) => !v)} title={leftOpen ? "Hide scenes panel" : "Show scenes panel"}>{leftOpen ? "‹ Scenes" : "☰ Scenes"}</button>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(201,168,107,.7)" }}>Now theming</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 22, color: "#f2ead6" }}>Scene {selIdx + 1}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label className="btn" style={{ ...panelBtn, cursor: "pointer" }} title="Insert an image into the text">
              ＋ Image
              <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ""; }} />
            </label>
            <SaveBadge state={saveState} />
            <Link href={readerHref} target="_blank" className="btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.8rem" }}>Preview ↗</Link>
            <button className="btn" style={panelBtn} onClick={() => setRightOpen((v) => !v)} title={rightOpen ? "Hide theme panel" : "Show theme panel"}>{rightOpen ? "Theme ›" : "Theme ☰"}</button>
          </div>
        </div>

        <div ref={pageRef} style={{ position: "relative", width: "100%", maxWidth: STAGE_MAX }}>
          <SceneRenderer theme={theme} minHeightVh={84} className="atelier-page" contentClassName={`leaf-ink${theme.dropCap ? " rdr-dropcap" : ""}`}>
            <SceneTextEditor key={selected.id} doc={selected.doc} html={selected.html} onEditor={setEditor} onFocus={() => setSelectedId(selected.id)} onChange={(c) => onSceneText(selected.id, c)} />
          </SceneRenderer>

          {/* draggable sticker handles (editor only) */}
          {(theme.stickers ?? []).length > 0 && !tool && (
            <div style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none" }}>
              {(theme.stickers ?? []).map((s) => (
                <div
                  key={s.id}
                  onPointerDown={dragSticker(s.id)}
                  title="Drag to reposition"
                  style={{ position: "absolute", left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", border: "1.5px dashed rgba(201,168,107,.8)", background: "rgba(201,168,107,.12)", cursor: "grab", pointerEvents: "auto", touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#e3c88c" }}
                >✥</div>
              ))}
            </div>
          )}

          {tool && (
            <div onClick={placeSticker} style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "crosshair" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center", pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".08em", color: "rgba(255,255,255,.6)" }}>click anywhere to place · {tool.label}</div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: theming toolkit (collapsible) */}
      {rightOpen && (
      <aside className="atelier-toolkit">
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 22, color: "#f2ead6", marginBottom: 2 }}>Scene Theme</div>
        <div style={{ fontSize: 11, color: "rgba(232,224,205,.42)", marginBottom: 26, lineHeight: 1.5 }}>Everything here is the story&rsquo;s weather. Set it once; it travels with the scene.</div>

        {/* Mood presets */}
        <div className="atelier-lbl">Mood</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28 }}>
          {THEME_PRESETS.map((p) => {
            const on = theme.label === p.theme.label;
            return (
              <button key={p.key} onClick={() => setTheme(structuredClone(presetByKey(p.key)))} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", background: on ? "rgba(201,168,107,.12)" : "rgba(255,255,255,.02)", border: `1px solid ${on ? "rgba(201,168,107,.5)" : "rgba(232,224,205,.1)"}`, borderRadius: 5, cursor: "pointer", color: "#e8e0cd", fontFamily: "var(--font-spectral), serif", fontSize: 11 }}>
                <span style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0, background: p.theme.background.gradient ?? p.theme.background.color, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)" }} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Saved looks / presets */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className="atelier-lbl" style={{ marginBottom: 0 }}>My presets</span>
          <button onClick={savePresetPrompt} style={{ background: "rgba(201,168,107,.16)", border: "1px solid rgba(201,168,107,.5)", color: "#e3c88c", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 999, cursor: "pointer" }}>+ Save look</button>
        </div>
        {customPresets.length === 0 ? (
          <div style={{ fontSize: 10, lineHeight: 1.5, color: "rgba(232,224,205,.4)", marginBottom: 28 }}>Save this scene&rsquo;s whole look — mood, ink, font, ambient effect (e.g. Rain) and stickers — to reuse on other scenes.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
            {customPresets.map((p) => (
              <span key={p.id} style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, background: "rgba(255,255,255,.03)", border: "1px solid rgba(232,224,205,.14)" }}>
                <button onClick={() => setTheme(structuredClone(p.theme))} title="Apply this look" style={{ background: "none", border: "none", color: "#e8e0cd", fontSize: 11, padding: "5px 4px 5px 12px", cursor: "pointer" }}>{p.name}</button>
                <button onClick={() => handleDeletePreset(p.id)} title="Delete preset" style={{ background: "none", border: "none", color: "rgba(232,224,205,.4)", fontSize: 12, padding: "5px 10px 5px 4px", cursor: "pointer" }}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* Ink & accent */}
        <div className="atelier-lbl">Ink &amp; Accent</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {INK_SWATCHES.map((c) => {
            const on = theme.ink.color === c;
            return <button key={c} onClick={() => patchInk({ color: c })} style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${on ? "#c9a86b" : "rgba(232,224,205,.15)"}`, boxShadow: on ? "0 0 0 3px rgba(201,168,107,.25)" : "none" }} />;
          })}
        </div>

        {/* Drop cap — opt-in enlarged first letter */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span className="atelier-lbl" style={{ marginBottom: 0 }}>Drop cap</span>
          <button onClick={() => patch({ dropCap: !theme.dropCap })} style={{ background: theme.dropCap ? "rgba(201,168,107,.16)" : "rgba(255,255,255,.03)", border: `1px solid ${theme.dropCap ? "rgba(201,168,107,.5)" : "rgba(232,224,205,.15)"}`, color: theme.dropCap ? "#e3c88c" : "rgba(232,224,205,.5)", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, cursor: "pointer" }}>{theme.dropCap ? "On" : "Off"}</button>
        </div>

        {/* Typeface */}
        <div className="atelier-lbl">Typeface</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28, maxHeight: 240, overflowY: "auto" }}>
          {FONT_REGISTRY.map((f) => {
            const on = theme.ink.fontKey === f.key;
            return (
              <button key={f.key} onClick={() => patchInk({ fontKey: f.key })} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "10px 13px", cursor: "pointer", borderRadius: 5, background: on ? "rgba(201,168,107,.12)" : "rgba(255,255,255,.02)", border: `1px solid ${on ? "rgba(201,168,107,.5)" : "rgba(232,224,205,.1)"}`, fontFamily: f.stack, fontSize: 17, color: "#f2ead6" }}>
                <span>{f.label.split(" — ")[0]}</span>
                <span style={{ fontFamily: "var(--font-spectral), serif", fontSize: 10, letterSpacing: ".06em", color: "rgba(232,224,205,.4)" }}>{f.label.split(" — ")[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Ambient effect (weather) */}
        <div className="atelier-lbl">Ambient Effect</div>
        <select
          value={theme.effect}
          onChange={(e) => patch({ effect: e.target.value as SceneTheme["effect"] })}
          style={{ width: "100%", height: 34, background: "#14131a", color: "#e8e0cd", border: "1px solid rgba(232,224,205,.16)", borderRadius: 6, fontSize: 13, padding: "0 8px", marginBottom: 14, cursor: "pointer", fontFamily: "var(--font-spectral), serif" }}
        >
          {EFFECT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span className="atelier-lbl" style={{ marginBottom: 0 }}>Intensity</span>
          <span style={{ fontSize: 11, color: "rgba(232,224,205,.5)" }}>{ambientPct}%</span>
        </div>
        <input type="range" min={0} max={100} value={ambientPct} onChange={(e) => patch({ effectIntensity: Number(e.target.value) / 100 })} style={{ width: "100%", marginBottom: 24, cursor: "pointer", accentColor: "#c9a86b" }} />

        {/* Background image + edge fade */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="atelier-lbl" style={{ marginBottom: 0 }}>Background image</span>
          <button onClick={() => patchBg({ kind: bgOn ? "gradient" : "image" })} style={{ background: bgOn ? "rgba(201,168,107,.16)" : "rgba(255,255,255,.03)", border: `1px solid ${bgOn ? "rgba(201,168,107,.5)" : "rgba(232,224,205,.15)"}`, color: bgOn ? "#e3c88c" : "rgba(232,224,205,.5)", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 999, cursor: "pointer" }}>{bgOn ? "On" : "Off"}</button>
        </div>
        <div style={{ opacity: bgOn ? 1 : 0.35, pointerEvents: bgOn ? "auto" : "none", transition: "opacity .3s", marginBottom: 8 }}>
          <label className="btn" style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem", marginBottom: 10 }}>
            {theme.background.imageUrl ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBg(f); }} />
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: ".1em", color: "rgba(232,224,205,.55)" }}>Edge fade</span>
            <span style={{ fontSize: 11, color: "rgba(232,224,205,.5)" }}>{fadePct}%</span>
          </div>
          <input type="range" min={0} max={100} value={fadePct} onChange={(e) => patch({ vignetteStrength: Number(e.target.value) / 100, edgeFade: "vignette" })} style={{ width: "100%", cursor: "pointer", accentColor: "#c9a86b" }} />
        </div>

        {/* Stickers */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 12px" }}>
          <span className="atelier-lbl" style={{ marginBottom: 0 }}>Stickers</span>
          <button onClick={() => { patch({ stickers: [] }); setTool(null); }} style={{ background: "none", border: "none", color: "rgba(232,224,205,.45)", fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>Clear</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {STICKER_PALETTE.map((s) => {
            const on = tool?.id === s.id;
            return <button key={s.id} title={s.label} onClick={() => setTool(on ? null : s)} style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", fontSize: 18, color: s.color, cursor: "pointer", borderRadius: 5, background: on ? "rgba(201,168,107,.16)" : "rgba(255,255,255,.02)", border: `1px solid ${on ? "rgba(201,168,107,.55)" : "rgba(232,224,205,.1)"}` }}>{s.glyph}</button>;
          })}
        </div>
        <div style={{ fontSize: 10, lineHeight: 1.5, color: "rgba(232,224,205,.38)", marginTop: 12 }}>Pick one, then click the page to drop it exactly where you want.</div>

        {/* Advanced (full control) */}
        <details style={{ marginTop: 26, borderTop: "1px solid rgba(201,168,107,.14)", paddingTop: 16 }}>
          <summary style={{ cursor: "pointer", fontSize: 9, letterSpacing: ".28em", textTransform: "uppercase", color: "#c9a86b", marginBottom: 12 }}>Advanced controls &amp; presets</summary>
          <div style={{ marginTop: 12 }}>
            <SceneInspector theme={theme} onChange={setTheme} customPresets={customPresets} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset} />
          </div>
        </details>
      </aside>
      )}
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  const map: Record<SaveState, { label: string; color: string }> = {
    idle: { label: "○ Ready", color: "rgba(232,224,205,.5)" },
    saving: { label: "◌ Saving…", color: "rgba(232,224,205,.7)" },
    saved: { label: "● Saved", color: "#7fbf7a" },
    error: { label: "▲ Failed", color: "#ffb4ac" },
  };
  const s = map[state];
  return <span style={{ fontSize: 11, color: s.color, whiteSpace: "nowrap" }}>{s.label}</span>;
}
