import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(
      session!.discordAccessToken,
      req.nextUrl.searchParams.get("guildId")
    );
    const data = await bridge.listGuildChannels(guildId);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
