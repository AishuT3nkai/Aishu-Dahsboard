import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "aishu_dashboard_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

interface SessionPayload {
  sub: string;
  username: string;
  avatar: string | null;
  // Discord OAuth access token, used only server-side to list the admin's
  // guilds for the guild switcher. Never sent to the browser as JS-readable
  // data — this cookie is httpOnly, Secure, SameSite=Lax, and encrypted.
  discordAccessToken: string;
}

async function getSecretKey(): Promise<Uint8Array> {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET is missing or too short. Set a long random value."
    );
  }

  // A fixed-length encryption key derived from the configured secret. WebCrypto
  // is supported in both the Node route handlers and Next.js Edge middleware.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return new Uint8Array(digest);
}

export async function createSession(payload: SessionPayload) {
  const token = await new EncryptJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .encrypt(await getSecretKey());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * The allowlist is the ONLY source of truth for dashboard access.
 * Discord Administrator / Manage Server permissions are never consulted here.
 */
export function isAuthorizedAdmin(discordUserId: string): boolean {
  const allowed = [
    process.env.ADMIN_USER_ID_1 ?? process.env.DISCORD_USER_ID_1,
    process.env.ADMIN_USER_ID_2 ?? process.env.DISCORD_USER_ID_2,
  ].filter(Boolean);
  return allowed.includes(discordUserId);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await readSession();
  if (!session) return null;
  return { id: session.sub, username: session.username, avatar: session.avatar };
}

export async function getDiscordAccessToken(): Promise<string | null> {
  const session = await readSession();
  return session?.discordAccessToken ?? null;
}
