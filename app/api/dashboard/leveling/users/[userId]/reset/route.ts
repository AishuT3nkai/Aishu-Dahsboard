import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { discordIdSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));

    if (!discordIdSchema.safeParse(params.userId).success) {
      return NextResponse.json({ error: "Invalid Discord user ID." }, { status: 400 });
    }
    const data = await bridge.resetUserXp(guildId, params.userId);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
