import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";

const SESSION_COOKIE = "aishu_dashboard_session";

function isAllowedAdmin(discordUserId: unknown): boolean {
  if (typeof discordUserId !== "string") return false;

  const allowed = [
    process.env.ADMIN_USER_ID_1 ?? process.env.DISCORD_USER_ID_1,
    process.env.ADMIN_USER_ID_2 ?? process.env.DISCORD_USER_ID_2,
  ].filter((value): value is string => Boolean(value));

  return allowed.includes(discordUserId);
}

// Defense-in-depth: dashboard pages and API routes both re-check that the
// session subject is still in the live two-user allowlist. API handlers also
// perform their authoritative admin and guild checks.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.DASHBOARD_SESSION_SECRET;

  let authorized = false;
  if (token && secret && secret.length >= 16) {
    try {
      // Match lib/session.ts: sessions are encrypted JWE tokens using a
      // SHA-256-derived A256GCM key, not signed JWS tokens.
      const key = new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))
      );
      const { payload } = await jwtDecrypt(token, key);
      authorized = isAllowedAdmin(payload.sub);
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated as an authorized dashboard admin." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", token ? "unauthorized" : "login_required");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview",
    "/verification",
    "/moderation",
    "/welcome",
    "/tickets",
    "/suggestions",
    "/reports",
    "/birthday",
    "/autorole",
    "/automod",
    "/webhooks",
    "/leveling",
    "/languages",
    "/server",
    "/commands",
    "/settings",
    "/api/dashboard/:path*",
    "/api/guild/:path*",
  ],
};
