import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/blob";

export async function POST(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 12MB)" }, { status: 413 });
  }
  const { url } = await saveUpload(file);
  return NextResponse.json({ url });
}
