import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { resourceIdSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const data = await bridge.listWarnings(guildId);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const warningId = req.nextUrl.searchParams.get("warningId");
    if (!warningId || !resourceIdSchema.safeParse(warningId).success) {
      return NextResponse.json({ error: "Invalid or missing warningId." }, { status: 400 });
    }
    await bridge.clearWarning(guildId, warningId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
