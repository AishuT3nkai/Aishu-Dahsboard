import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const data = await bridge.listLevelingUsers(guildId, search);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
