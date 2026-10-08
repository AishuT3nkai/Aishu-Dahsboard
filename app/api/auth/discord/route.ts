import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { buildAuthorizeUrl } from "@/lib/discord";

const STATE_COOKIE = "aishu_oauth_state";

export async function GET() {
  const state = randomBytes(16).toString("hex");

  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes to complete login
  });

  try {
    return NextResponse.redirect(buildAuthorizeUrl(state));
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Discord OAuth is not configured on this deployment." },
      { status: 500 }
    );
  }
}
