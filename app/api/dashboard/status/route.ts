import { NextResponse } from "next/server";
import { requireAdminSession, handleApiError } from "@/lib/authGuard";
import { isBridgeConfigured } from "@/lib/bridge";

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({
      bridgeConfigured: isBridgeConfigured(),
      guildPinned: Boolean(process.env.ADMIN_GUILD_ID),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
