import "server-only";

// Images are stored inline as base64 `data:` URLs (in the DB, wherever the
// returned URL is saved). This needs no filesystem and no blob service, so it
// works on serverless (Vercel) out of the box. If image volume grows, this is
// the single place to swap in Vercel Blob (`put()` from @vercel/blob) — callers
// only ever see the returned URL.
export async function saveUpload(file: File): Promise<{ url: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type && file.type.startsWith("image/") ? file.type : "application/octet-stream";
  const url = `data:${mime};base64,${bytes.toString("base64")}`;
  return { url };
}
