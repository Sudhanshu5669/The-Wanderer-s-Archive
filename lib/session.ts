// Edge-safe session primitives (no Prisma / bcrypt / next/headers here), so the
// middleware can import this to verify the session cookie at the edge.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "wanderer_session";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email === "string") return { email: payload.email };
    return null;
  } catch {
    return null;
  }
}
