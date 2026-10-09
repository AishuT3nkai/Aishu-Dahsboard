import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";

const SESSION_COOKIE = "aishu_dashboard_session";

async function getSessionKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return new Uint8Array(digest);
}

// Only the sign-in entry point and OAuth handshake are public. Every other
// route is protected by default, so adding a new dashboard page (for example
// /webhooks) cannot accidentally bypass authentication just because it was
// omitted from a hand-maintained list.
function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.DASHBOARD_SESSION_SECRET;

  let valid = false;
  if (token && secret) {
    try {
      await jwtDecrypt(token, await getSessionKey(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Skip framework assets and public files. Protect all app routes and APIs
  // by default; isPublicPath() is the explicit allowlist for OAuth routes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|map|webmanifest)$).*)",
  ],
};
