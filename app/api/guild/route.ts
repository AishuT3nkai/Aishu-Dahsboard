import { NextResponse } from "next/server";
import { requireAdminSession, authorizedGuildsFor, handleApiError } from "@/lib/authGuard";
import { readSession } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminSession();
    const session = await readSession();
    const guilds = await authorizedGuildsFor(session!.discordAccessToken);
    return NextResponse.json({ guilds });
  } catch (err) {
    return handleApiError(err);
  }
}
