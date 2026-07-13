import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Next 16 "proxy" (formerly middleware) — guards the Archivist area.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/archivist/login";

  if (!session && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/archivist/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/archivist";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/archivist/:path*"],
};
