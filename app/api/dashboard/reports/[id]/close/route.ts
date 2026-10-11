import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { resourceIdSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    if (!resourceIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
    }
    const data = await bridge.closeReport(guildId, id);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
