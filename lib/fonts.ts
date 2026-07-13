// Loads the curated font library via next/font and exposes the CSS-variable
// className to attach to <body>. Imported only by app/layout.tsx (server).
// For the fontKey -> CSS stack mapping used elsewhere, see ./font-registry.
import {
  EB_Garamond,
  Cormorant_Garamond,
  Lora,
  Spectral,
  Playfair_Display,
  IM_Fell_English,
  Cinzel,
  Uncial_Antiqua,
  Pirata_One,
  Caveat,
  Creepster,
  Special_Elite,
  JetBrains_Mono,
} from "next/font/google";

const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-spectral",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  display: "swap",
});
const fell = IM_Fell_English({
  subsets: ["latin"],
  variable: "--font-fell",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const uncial = Uncial_Antiqua({ subsets: ["latin"], variable: "--font-uncial", weight: "400", display: "swap" });
const pirata = Pirata_One({ subsets: ["latin"], variable: "--font-pirata", weight: "400", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
const creepster = Creepster({ subsets: ["latin"], variable: "--font-creepster", weight: "400", display: "swap" });
const typewriter = Special_Elite({ subsets: ["latin"], variable: "--font-typewriter", weight: "400", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

/** Space-separated className that attaches every font variable to <body>. */
export const fontVariables = [
  garamond.variable,
  cormorant.variable,
  lora.variable,
  spectral.variable,
  playfair.variable,
  fell.variable,
  cinzel.variable,
  uncial.variable,
  pirata.variable,
  caveat.variable,
  creepster.variable,
  typewriter.variable,
  mono.variable,
].join(" ");
