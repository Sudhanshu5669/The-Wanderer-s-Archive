// Server-only auth: credential verification against the DB, and session helpers
// for server components / server actions / route handlers.
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { email: user.email } : null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** Current archivist session (or null) — for use in server components. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function isArchivist(): Promise<boolean> {
  return (await getSession()) !== null;
}
