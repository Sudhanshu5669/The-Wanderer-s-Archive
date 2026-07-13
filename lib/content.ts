import { normalizeTheme, defaultTheme, type SceneTheme } from "./theme";

// A Chapter's content is a JSON document of ordered Scenes. Each Scene owns a
// theme and its rich text (stored as both TipTap JSON `doc` for editing and
// rendered `html` for fast, SSR-friendly reading).
export interface Scene {
  id: string;
  theme: SceneTheme;
  doc?: unknown; // TipTap JSON (editor source of truth)
  html: string; // rendered HTML (reader)
}

export interface ChapterDoc {
  scenes: Scene[];
}

export function emptyChapterDoc(): ChapterDoc {
  return {
    scenes: [
      {
        id: randomId(),
        theme: defaultTheme(),
        doc: undefined,
        html: "<p></p>",
      },
    ],
  };
}

export function parseChapterContent(content: string | null | undefined): ChapterDoc {
  if (!content) return emptyChapterDoc();
  try {
    const parsed = JSON.parse(content) as ChapterDoc;
    if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return emptyChapterDoc();
    }
    return {
      scenes: parsed.scenes.map((s) => ({
        id: s.id || randomId(),
        theme: normalizeTheme(s.theme as Partial<SceneTheme>),
        doc: s.doc,
        html: typeof s.html === "string" ? s.html : "<p></p>",
      })),
    };
  } catch {
    return emptyChapterDoc();
  }
}

export function serializeChapterContent(doc: ChapterDoc): string {
  return JSON.stringify(doc);
}

/** Plain-text excerpt from a scene's html (for previews / word counts). */
export function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
