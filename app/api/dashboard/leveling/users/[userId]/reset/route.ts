import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const data = await bridge.resetUserXp(guildId, params.userId);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
