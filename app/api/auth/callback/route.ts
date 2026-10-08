import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForToken, fetchDiscordUser } from "@/lib/discord";
import { createSession, isAuthorizedAdmin } from "@/lib/session";

const STATE_COOKIE = "aishu_oauth_state";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies().get(STATE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=state_mismatch", req.url));
  }

  try {
    const token = await exchangeCodeForToken(code);
    const discordUser = await fetchDiscordUser(token.access_token);

    // The allowlist is the source of truth. Discord role/permission data is
    // never consulted for dashboard authorization.
    if (!isAuthorizedAdmin(discordUser.id)) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    await createSession({
      sub: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      discordAccessToken: token.access_token,
    });

    return NextResponse.redirect(new URL("/overview", req.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
