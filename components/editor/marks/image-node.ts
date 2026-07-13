import { Node, mergeAttributes } from "@tiptap/core";

// A block image that lives *inside* the prose (not an absolute overlay), so it
// flows with the text — put it before or after any paragraph and it stays under
// exactly that sentence on every screen. Renders a plain <img>, which the reader
// already styles via `.ink img`, so editor and reader match. Dependency-free
// (the official @tiptap/extension-image isn't installed).

export interface ImageOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sceneImage: {
      /** Insert a block image at the current position. */
      setImage: (attrs: { src: string; alt?: string; width?: string | null }) => ReturnType;
    };
  }
}

export const Image = Node.create<ImageOptions>({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      // Optional author width (e.g. "60%"); default is natural size capped at 100%.
      width: {
        default: null as string | null,
        parseHTML: (el) => (el as HTMLElement).style.width || el.getAttribute("width") || null,
        renderHTML: (attrs: { width?: string | null }) =>
          attrs.width ? { style: `width: ${attrs.width}` } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
