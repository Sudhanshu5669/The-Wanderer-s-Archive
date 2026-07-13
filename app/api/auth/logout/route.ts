import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.redirect(new URL("/archivist/login", req.url));
}
