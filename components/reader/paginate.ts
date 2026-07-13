import type { CSSProperties } from "react";

// Split a scene's HTML into page-sized chunks by measuring real layout in the
// browser. Breaks only at block boundaries (no mid-sentence splits), which is
// exactly how a printed book behaves.
export function paginateHtml(
  html: string,
  width: number,
  height: number,
  ink: CSSProperties,
): string[] {
  if (typeof document === "undefined" || width <= 0 || height <= 0) return [html || "<p></p>"];

  const measurer = document.createElement("div");
  measurer.className = "ink leaf-ink";
  Object.assign(measurer.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    width: `${width}px`,
    maxWidth: "none",
    visibility: "hidden",
    pointerEvents: "none",
  });
  // Apply the scene's typography so measurement matches the rendered page.
  const keys: (keyof CSSProperties)[] = [
    "fontFamily",
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "fontWeight",
    "textAlign",
  ];
  for (const k of keys) {
    const v = ink[k];
    if (v !== undefined) (measurer.style as unknown as Record<string, string>)[k as string] = String(v);
  }

  measurer.innerHTML = html && html.trim() ? html : "<p></p>";
  document.body.appendChild(measurer);

  const children = Array.from(measurer.children) as HTMLElement[];
  if (children.length === 0) {
    document.body.removeChild(measurer);
    return ["<p></p>"];
  }

  const pages: string[] = [];
  let current: HTMLElement[] = [];
  let pageTop = children[0].offsetTop;

  for (const child of children) {
    const bottom = child.offsetTop + child.offsetHeight;
    if (current.length > 0 && bottom - pageTop > height) {
      pages.push(current.map((n) => n.outerHTML).join(""));
      current = [child];
      pageTop = child.offsetTop;
    } else {
      current.push(child);
    }
  }
  if (current.length > 0) pages.push(current.map((n) => n.outerHTML).join(""));

  document.body.removeChild(measurer);
  return pages.length > 0 ? pages : ["<p></p>"];
}
