import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "aishu_dashboard_session";

// This is defense-in-depth. The authoritative check is
// requireAdminSession() inside every /api/dashboard/* route handler, which
// also re-checks the two-ID allowlist on every call. Middleware just keeps
// unauthenticated requests from reaching the page/route at all.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.DASHBOARD_SESSION_SECRET;

  let valid = false;
  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
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
    "/leveling",
    "/languages",
    "/server",
    "/commands",
    "/settings",
    "/api/dashboard/:path*",
    "/api/guild/:path*",
  ],
};
