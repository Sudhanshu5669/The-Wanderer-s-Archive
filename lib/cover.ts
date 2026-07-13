// Cover "moods" from the imported Shelf/Book designs — a genre maps to a spine
// palette. Pure module (no server/client deps) so it's usable anywhere.
export interface CoverMood {
  key: string;
  bg: string;
  ink: string;
  tag: string;
  rule: string;
  meta: string;
  sheen: string;
}

export const COVER_MOODS: Record<string, CoverMood> = {
  night: { key: "night", bg: "linear-gradient(165deg,#12131f,#080810)", ink: "#eef0f6", tag: "#8fa0c8", rule: "rgba(143,160,200,.6)", meta: "rgba(233,229,216,.4)", sheen: "radial-gradient(120% 60% at 20% 12%, rgba(180,196,230,.10), transparent 55%)" },
  hell: { key: "hell", bg: "linear-gradient(165deg,#2a0d0a,#3d1108 55%,#160504)", ink: "#f6e3d0", tag: "#e08a5a", rule: "rgba(224,138,90,.7)", meta: "rgba(246,227,208,.42)", sheen: "radial-gradient(120% 70% at 80% 0%, rgba(230,90,40,.22), transparent 60%)" },
  heaven: { key: "heaven", bg: "linear-gradient(165deg,#4a3714,#6b4e1c 50%,#2c1f0b)", ink: "#fbf3dc", tag: "#f0d68f", rule: "rgba(240,214,143,.8)", meta: "rgba(251,243,220,.5)", sheen: "radial-gradient(120% 80% at 50% 0%, rgba(255,224,150,.28), transparent 60%)" },
  fight: { key: "fight", bg: "linear-gradient(165deg,#1a1a1c,#0b0b0c)", ink: "#f4f4f2", tag: "#b9b9bd", rule: "rgba(255,255,255,.55)", meta: "rgba(244,244,242,.4)", sheen: "linear-gradient(115deg, rgba(255,255,255,.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,.04) 100%)" },
  river: { key: "river", bg: "linear-gradient(165deg,#0c2226,#08181b 60%,#040e10)", ink: "#dff0ef", tag: "#6fb7ba", rule: "rgba(111,183,186,.65)", meta: "rgba(223,240,239,.42)", sheen: "radial-gradient(120% 70% at 25% 10%, rgba(90,190,190,.14), transparent 55%)" },
  ash: { key: "ash", bg: "linear-gradient(165deg,#20201d,#121210)", ink: "#eae4d4", tag: "#c9a86b", rule: "rgba(201,168,107,.7)", meta: "rgba(234,228,212,.42)", sheen: "radial-gradient(120% 70% at 30% 8%, rgba(201,168,107,.12), transparent 55%)" },
};

const GENRE_MOOD: Record<string, string> = {
  mythology: "night",
  horror: "hell",
  fiction: "heaven",
  "true crime": "fight",
  investigation: "river",
  "sci-fi": "river",
  fantasy: "night",
};

export function moodForGenre(genre?: string): CoverMood {
  const key = genre ? GENRE_MOOD[genre.trim().toLowerCase()] : undefined;
  return COVER_MOODS[key ?? "ash"];
}

/** Human meta label from a book's type + story count. */
export function bookMeta(type: string, storyCount: number): string {
  if (type === "COLLECTION") return `${storyCount} ${storyCount === 1 ? "story" : "stories"}`;
  return "Single story";
}
