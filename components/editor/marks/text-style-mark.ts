import { Mark, mergeAttributes } from "@tiptap/core";

// A dependency-free `textStyle` mark (the official @tiptap/extension-text-style
// isn't installed). It renders a <span style="…"> carrying any combination of
// inline typography — font family, colour, size, letter spacing — so a reader
// can highlight *any* letter range and restyle just those characters. TipTap's
// setMark merges existing attributes, so setting a colour keeps the font, etc.
//
// The stored HTML (span + inline style) is exactly what the reader renders via
// SceneRenderer's dangerouslySetInnerHTML, so the archivist gets true WYSIWYG.

export interface TextStyleOptions {
  HTMLAttributes: Record<string, unknown>;
}

/** Build one addAttributes entry that maps a state field to a CSS declaration. */
function cssAttr(cssProp: string) {
  return {
    default: null as string | null,
    parseHTML: (el: HTMLElement) => el.style.getPropertyValue(cssProp) || null,
    renderHTML: (attrs: Record<string, string | null | undefined>) => {
      const key = cssPropToKey[cssProp];
      const value = attrs[key];
      return value ? { style: `${cssProp}: ${value}` } : {};
    },
  };
}

const cssPropToKey: Record<string, string> = {
  color: "color",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "letter-spacing": "letterSpacing",
};

export const TextStyle = Mark.create<TextStyleOptions>({
  name: "textStyle",

  addOptions() {
    return { HTMLAttributes: {} };
  },

  // Only claim spans that actually carry inline style, so we don't swallow
  // unrelated markup on paste.
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (node) =>
          (node as HTMLElement).hasAttribute("style") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addAttributes() {
    return {
      color: cssAttr("color"),
      fontFamily: cssAttr("font-family"),
      fontSize: cssAttr("font-size"),
      letterSpacing: cssAttr("letter-spacing"),
    };
  },
});
