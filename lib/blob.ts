import "server-only";
import sharp from "sharp";

// Images are stored inline as base64 `data:` URLs (in the DB, wherever the
// returned URL is saved). This needs no filesystem and no blob service, so it
// works on serverless (Vercel) out of the box. If image volume grows, this is
// the single place to swap in Vercel Blob (`put()` from @vercel/blob) — callers
// only ever see the returned URL.
//
// Because every stored byte is base64 (+33%) and lives inside a CockroachDB
// row that gets pulled in full on each read, we re-encode raster uploads to
// WebP and cap their dimensions here. That typically shrinks a phone photo or
// large PNG 5–10× before it ever touches the DB or the reader's HTML payload.

// Longest-edge cap for stored raster images. Comfortably covers full-bleed
// scene backgrounds on high-DPI displays while keeping rows small.
const MAX_DIMENSION = 1600;
// WebP quality — 80 is visually near-lossless for photographic content.
const WEBP_QUALITY = 80;

// Formats sharp can't (or shouldn't) re-encode without losing something:
// SVGs are vector and would be rasterized; unknown/binary types pass through.
function isCompressibleRaster(mime: string): boolean {
  return (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/gif" ||
    mime === "image/avif" ||
    mime === "image/tiff"
  );
}

export async function saveUpload(file: File): Promise<{ url: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";

  if (isCompressibleRaster(mime)) {
    try {
      // `animated` preserves multi-frame GIF/WebP; `withoutEnlargement` avoids
      // upscaling small images (e.g. stickers) past their native size.
      const out = await sharp(bytes, { animated: true })
        .rotate() // bake in EXIF orientation before we drop the metadata
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      // Only keep the re-encoded version if it actually came out smaller;
      // for already-tiny/optimized images the original can win.
      const chosen = out.length < bytes.length ? out : bytes;
      const outMime = chosen === out ? "image/webp" : mime;
      return { url: `data:${outMime};base64,${chosen.toString("base64")}` };
    } catch {
      // Corrupt or unsupported payload — fall through to storing as-is.
    }
  }

  const safeMime = mime.startsWith("image/") ? mime : "application/octet-stream";
  return { url: `data:${safeMime};base64,${bytes.toString("base64")}` };
}
