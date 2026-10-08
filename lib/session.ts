import { SignJWT, jwtVerify } from "jose";
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
  // data — this cookie is httpOnly, Secure, SameSite=Lax, and signed.
  discordAccessToken: string;
}

function getSecretKey() {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "DASHBOARD_SESSION_SECRET is missing or too short. Set a long random value."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

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
    const { payload } = await jwtVerify(token, getSecretKey());
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
  const allowed = [process.env.ADMIN_USER_ID_1, process.env.ADMIN_USER_ID_2].filter(
    Boolean
  );
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
