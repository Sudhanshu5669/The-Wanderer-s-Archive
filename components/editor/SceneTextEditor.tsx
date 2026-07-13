"use client";

import { useEffect, useReducer, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "./marks/text-style-mark";
import { Image } from "./marks/image-node";
import { FONT_REGISTRY, fontStack } from "@/lib/font-registry";

export interface SceneTextChange {
  doc: unknown;
  html: string;
}

// Colours offered in the inline picker (mirrors the scene ink swatches + a few
// warm accents). The native colour input still allows *any* value.
const WORD_COLORS = ["#eef0f6", "#f7e5d2", "#c9a86b", "#e08a5a", "#8fa0c8", "#6fb7ba", "#e0574a", "#111112"];

// Named sizes, expressed in em so they scale with the scene's base ink size.
const WORD_SIZES: { label: string; value: string | null }[] = [
  { label: "Default", value: null },
  { label: "XS", value: "0.75em" },
  { label: "S", value: "0.88em" },
  { label: "M", value: "1.15em" },
  { label: "L", value: "1.4em" },
  { label: "XL", value: "1.8em" },
  { label: "XXL", value: "2.4em" },
];

export function SceneTextEditor({
  doc,
  html,
  onChange,
  onFocus,
  onEditor,
}: {
  doc?: unknown;
  html: string;
  onChange: (change: SceneTextChange) => void;
  onFocus?: () => void;
  /** Surfaces the TipTap instance so a parent can host toolbar controls. */
  onEditor?: (editor: Editor | null) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Image,
      Placeholder.configure({ placeholder: "Write the scene…  (⏎ for a new paragraph)" }),
    ],
    content: (doc as object) ?? html ?? "<p></p>",
    editorProps: {
      attributes: { class: "pm-editable", spellcheck: "true" },
    },
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange({ doc: editor.getJSON(), html: editor.getHTML() });
    },
  });

  useEffect(() => {
    onEditor?.(editor);
    return () => onEditor?.(null);
  }, [editor, onEditor]);

  return (
    <>
      <EditorContent editor={editor} onFocusCapture={onFocus} />
      {editor && <WordFormatBubble editor={editor} />}
    </>
  );
}

/**
 * Selection toolbar for letter-level typography. Highlight any range — a single
 * letter, a word, a phrase — and set its font, colour, size, or weight without
 * touching the scene's default styling.
 */
function WordFormatBubble({ editor }: { editor: Editor }) {
  // Re-render the controls whenever the selection or content changes so they
  // reflect the currently highlighted range.
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  const attrs = editor.getAttributes("textStyle") as {
    fontFamily?: string | null;
    color?: string | null;
    fontSize?: string | null;
  };
  const activeFontKey = FONT_REGISTRY.find((f) => f.stack === attrs.fontFamily)?.key ?? "";
  const activeColor = attrs.color ?? "";
  const activeSize = attrs.fontSize ?? "";

  const setStyle = (patch: Record<string, string | null>) =>
    editor.chain().focus().setMark("textStyle", patch).run();

  const clearAll = () =>
    editor
      .chain()
      .focus()
      .unsetMark("textStyle")
      .unsetBold()
      .unsetItalic()
      .unsetUnderline()
      .unsetStrike()
      .run();

  const tBtn = (active: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
    minWidth: 26,
    height: 26,
    padding: "0 7px",
    borderRadius: 5,
    border: `1px solid ${active ? "rgba(201,168,107,.6)" : "rgba(232,224,205,.14)"}`,
    background: active ? "rgba(201,168,107,.16)" : "transparent",
    color: active ? "#e3c88c" : "rgba(232,224,205,.7)",
    cursor: "pointer",
    fontSize: 13,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...extra,
  });

  const selectStyle: React.CSSProperties = {
    height: 26,
    background: "#14131a",
    color: "#e8e0cd",
    border: "1px solid rgba(232,224,205,.16)",
    borderRadius: 5,
    fontSize: 12,
    padding: "0 6px",
    cursor: "pointer",
    fontFamily: "var(--font-spectral), serif",
  };

  if (!mounted) return null;

  return createPortal(
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 10, strategy: "fixed" }}
      shouldShow={({ editor: e, from, to }) => !e.state.selection.empty && from !== to}
      // Rendered into <body> so it floats above the scene's vignette/sticker
      // layers instead of being painted behind them.
      style={{ zIndex: 2147483000 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          background: "rgba(16,15,22,.97)",
          border: "1px solid rgba(201,168,107,.28)",
          borderRadius: 9,
          boxShadow: "0 14px 40px rgba(0,0,0,.55)",
          backdropFilter: "blur(6px)",
          flexWrap: "wrap",
          maxWidth: 380,
        }}
        // keep the editor selection alive while interacting with the toolbar
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* weight / style toggles */}
        <button style={tBtn(editor.isActive("bold"), { fontWeight: 700 })} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">B</button>
        <button style={tBtn(editor.isActive("italic"), { fontStyle: "italic" })} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">i</button>
        <button style={tBtn(editor.isActive("underline"), { textDecoration: "underline" })} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">U</button>
        <button style={tBtn(editor.isActive("strike"), { textDecoration: "line-through" })} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">S</button>

        <span style={{ width: 1, height: 18, background: "rgba(232,224,205,.14)" }} />

        {/* font family */}
        <select
          value={activeFontKey}
          onChange={(e) => setStyle({ fontFamily: e.target.value ? fontStack(e.target.value) : null })}
          style={{ ...selectStyle, maxWidth: 132 }}
          title="Font"
        >
          <option value="">Default font</option>
          {FONT_REGISTRY.map((f) => (
            <option key={f.key} value={f.key}>{f.label.split(" — ")[0]}</option>
          ))}
        </select>

        {/* size */}
        <select
          value={activeSize}
          onChange={(e) => setStyle({ fontSize: e.target.value || null })}
          style={selectStyle}
          title="Size"
        >
          {WORD_SIZES.map((s) => (
            <option key={s.label} value={s.value ?? ""}>{s.label}</option>
          ))}
        </select>

        <span style={{ width: 1, height: 18, background: "rgba(232,224,205,.14)" }} />

        {/* colour swatches */}
        {WORD_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setStyle({ color: c })}
            title={c}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: c,
              cursor: "pointer",
              border: `2px solid ${activeColor.toLowerCase() === c.toLowerCase() ? "#c9a86b" : "rgba(232,224,205,.18)"}`,
            }}
          />
        ))}
        {/* any colour */}
        <label style={{ ...tBtn(false), position: "relative", overflow: "hidden", padding: 0, width: 26 }} title="Custom colour">
          <span style={{ fontSize: 12 }}>🎨</span>
          <input
            type="color"
            value={activeColor || "#c9a86b"}
            onChange={(e) => setStyle({ color: e.target.value })}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          />
        </label>

        <span style={{ width: 1, height: 18, background: "rgba(232,224,205,.14)" }} />

        {/* reset the selection to the scene default */}
        <button style={tBtn(false, { fontSize: 11, color: "rgba(232,224,205,.55)" })} onClick={clearAll} title="Clear formatting">↺</button>
      </div>
    </BubbleMenu>,
    document.body,
  );
}

/** Minimal formatting toolbar for the currently focused scene editor. */
export function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const btn = (active: boolean): React.CSSProperties => ({
    padding: "0.2rem 0.5rem",
    fontSize: "0.8rem",
    borderColor: active ? "var(--gold)" : "var(--line)",
    color: active ? "var(--gold-soft)" : "var(--ink-dim)",
  });
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
      <button className="btn" style={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </button>
      <button className="btn" style={{ ...btn(editor.isActive("italic")), fontStyle: "italic" }} onClick={() => editor.chain().focus().toggleItalic().run()}>
        i
      </button>
      <button className="btn" style={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H
      </button>
      <button className="btn" style={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </button>
      <button className="btn" style={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ❧
      </button>
    </div>
  );
}
