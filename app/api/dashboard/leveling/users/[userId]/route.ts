import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { xpSetSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const body = xpSetSchema.parse(await req.json());
    const data = await bridge.setUserXp(guildId, params.userId, body.xp);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
