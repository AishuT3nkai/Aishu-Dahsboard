import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { suggestionDecisionSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
    const body = suggestionDecisionSchema.parse(await req.json());
    const data = await bridge.decideSuggestion(guildId, params.id, body.decision, body.note);
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
