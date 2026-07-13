// Pure font registry (no next/font import) so client components can resolve a
// fontKey -> CSS stack without pulling the font loaders into the client bundle.
// The CSS variables referenced here are attached to <body> in app/layout.tsx.
export interface FontEntry {
  key: string;
  label: string;
  stack: string;
}

export const FONT_REGISTRY: FontEntry[] = [
  { key: "garamond", label: "EB Garamond — classic serif", stack: "var(--font-garamond), Georgia, serif" },
  { key: "cormorant", label: "Cormorant — elegant serif", stack: "var(--font-cormorant), Georgia, serif" },
  { key: "lora", label: "Lora — warm & readable", stack: "var(--font-lora), Georgia, serif" },
  { key: "spectral", label: "Spectral — modern serif", stack: "var(--font-spectral), Georgia, serif" },
  { key: "playfair", label: "Playfair Display — high contrast", stack: "var(--font-playfair), Georgia, serif" },
  { key: "fell", label: "IM Fell English — antique press", stack: "var(--font-fell), Georgia, serif" },
  { key: "cinzel", label: "Cinzel — epic Roman caps", stack: "var(--font-cinzel), serif" },
  { key: "uncial", label: "Uncial Antiqua — medieval", stack: "var(--font-uncial), serif" },
  { key: "pirata", label: "Pirata One — blackletter", stack: "var(--font-pirata), serif" },
  { key: "caveat", label: "Caveat — handwritten", stack: "var(--font-caveat), cursive" },
  { key: "creepster", label: "Creepster — horror", stack: "var(--font-creepster), cursive" },
  { key: "typewriter", label: "Special Elite — typewriter / report", stack: "var(--font-typewriter), monospace" },
  { key: "mono", label: "JetBrains Mono — clean mono", stack: "var(--font-mono), monospace" },
];

export function fontStack(key: string): string {
  return FONT_REGISTRY.find((f) => f.key === key)?.stack ?? FONT_REGISTRY[0].stack;
}
