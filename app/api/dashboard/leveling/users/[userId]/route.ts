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

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = xpSetSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await bridge.setUserXp(guildId, params.userId, parsed.data.xp);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
