import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomId } from "./content";

// Local-disk upload for development. At deploy this is the single place to swap
// in Vercel Blob (`put()` from @vercel/blob) — the rest of the app just uses the
// returned URL.
export async function saveUpload(file: File): Promise<{ url: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const rawExt = file.name.includes(".") ? file.name.split(".").pop() ?? "bin" : "bin";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
  const name = `${randomId()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { url: `/uploads/${name}` };
}
