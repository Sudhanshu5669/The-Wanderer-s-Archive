import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { presetByKey } from "../lib/theme";
import { randomId } from "../lib/content";
import { slugify } from "../lib/slug";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function scene(themeKey: string, html: string) {
  return { id: randomId(), theme: presetByKey(themeKey), html };
}

async function main() {
  // 1) The Archivist
  const email = (process.env.ARCHIVIST_EMAIL ?? "sudhanshu@wanderer.archive").toLowerCase();
  const password = process.env.ARCHIVIST_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });
  console.log(`Archivist ready: ${email}`);

  // Only seed demo books once.
  const existing = await prisma.book.count();
  if (existing > 0) {
    console.log("Books already present — skipping demo content.");
    return;
  }

  // 2) The Shadow of Elysium — the showcase book
  const shadow = await prisma.book.create({
    data: {
      title: "The Shadow of Elysium",
      slug: slugify("The Shadow of Elysium"),
      blurb:
        "A wanderer is dragged through the furnace of the underworld and clawed toward the light. Every page burns, breaks, or shines with where he stands.",
      genres: JSON.stringify(["Mythology", "Fantasy", "Horror"]),
      type: "SINGLE",
      visibility: "PUBLIC",
      order: 0,
      stories: {
        create: {
          title: "The Shadow of Elysium",
          slug: "main",
          order: 0,
          chapters: {
            create: [
              {
                title: "Descent",
                slug: "descent",
                order: 0,
                content: JSON.stringify({
                  scenes: [
                    scene(
                      "hell",
                      `<p>The gate did not open so much as <em>exhale</em>. Heat rolled up the stairwell in a slow red tide, and Kael felt the ink of his own name blister on the parchment of the world.</p><p>Below, the furnaces of the underworld breathed like a sleeping god. Every step downward peeled another layer of the man he had been. The air tasted of copper and burning hymns.</p><p>"You are early," said the thing at the bottom of the stair, and its voice was the sound a page makes when it catches fire.</p>`,
                    ),
                    scene(
                      "brutal",
                      `<p>Then the blades came.</p><p>There was no color left to the world — only the white of bared teeth and the black of the space between heartbeats. Kael moved. The sword moved. Somewhere a bell that was not a bell began to toll.</p><p>Sharp. Brutal. Clean. He did not think of mercy. He thought of the stair, and the light that might wait at the top of it.</p>`,
                    ),
                  ],
                }),
              },
              {
                title: "The Ascent",
                slug: "the-ascent",
                order: 1,
                content: JSON.stringify({
                  scenes: [
                    scene(
                      "heaven",
                      `<p>The last door gave way to gold.</p><p>Light did not fall here; it <em>rose</em>, warm as forgiveness, gilding the dust into slow constellations. Kael's wounds did not close, but they stopped mattering. For the first time since the gate, he breathed without counting the cost of it.</p><p>Elysium was not a place, he understood now. It was permission.</p>`,
                    ),
                    scene(
                      "night",
                      `<p>By nightfall he sat at the edge of everything, and the sky remembered how to hold stars.</p><p>They came out one by one, shy at first, then in their thousands — each a small cold fire that asked nothing of him. He let the dark be dark. He let the quiet be quiet.</p><p>Tomorrow, the wandering would begin again. Tonight, he simply watched the heavens breathe.</p>`,
                    ),
                  ],
                }),
              },
            ],
          },
        },
      },
    },
  });
  console.log(`Seeded book: ${shadow.title}`);

  // 3) A second shelf item to show the archive grid + a different genre voice
  await prisma.book.create({
    data: {
      title: "Case File: The Hollow Mile",
      slug: slugify("Case File: The Hollow Mile"),
      blurb:
        "Field notes from a disappearance that refuses to stay solved. Read it as it was filed — typed, redacted, and cold to the touch.",
      genres: JSON.stringify(["True Crime", "Investigation"]),
      type: "SINGLE",
      visibility: "PUBLIC",
      order: 1,
      stories: {
        create: {
          title: "Case File: The Hollow Mile",
          slug: "main",
          order: 0,
          chapters: {
            create: [
              {
                title: "Intake",
                slug: "intake",
                order: 0,
                content: JSON.stringify({
                  scenes: [
                    {
                      id: randomId(),
                      theme: {
                        ...presetByKey("parchment"),
                        label: "Report",
                        background: {
                          kind: "gradient",
                          color: "#161616",
                          gradient:
                            "linear-gradient(180deg, #1c1c1c 0%, #121212 100%)",
                        },
                        edgeFade: "vignette",
                        edgeFadeColor: "#0d0d0d",
                        ink: {
                          color: "#d8d5cc",
                          fontKey: "typewriter",
                          fontSize: 0.98,
                          lineHeight: 1.9,
                          letterSpacing: 0.01,
                          weight: 400,
                          filter: "none",
                          align: "left",
                        },
                        effect: "none",
                        vignetteStrength: 0.4,
                      },
                      html: `<p><strong>CASE #</strong> 44-Δ &nbsp; | &nbsp; <strong>STATUS:</strong> OPEN</p><p>Subject was last seen at the ninth marker of the old service road locals call the Hollow Mile. No vehicle recovered. No signs of struggle. Only a single shoe, laced.</p><p>The witnesses do not agree on the weather that night. That is the first thing about this file that frightens me.</p>`,
                    },
                  ],
                }),
              },
            ],
          },
        },
      },
    },
  });
  console.log("Seeded book: Case File: The Hollow Mile");
}

main()
  .then(() => console.log("Seed complete."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
