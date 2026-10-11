import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";
import { bridge } from "@/lib/bridge";
import { guildIdFromRequest } from "@/lib/apiHelpers";
import { resourceIdSchema, suggestionDecisionSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdminSession();
    const session = await readSession();
    const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));

    if (!resourceIdSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid suggestion ID." }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = suggestionDecisionSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await bridge.decideSuggestion(
      guildId,
      id,
      parsed.data.decision,
      parsed.data.note
    );
    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err);
  }
}
