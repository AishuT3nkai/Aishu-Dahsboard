import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { requireAdminSession, requireAuthorizedGuild, handleApiError } from "./authGuard";
import { readSession } from "./session";

export function guildIdFromRequest(req: NextRequest): string | null {
  return req.nextUrl.searchParams.get("guildId");
}

/**
 * Builds GET/PUT handlers for a single "config object" resource scoped to a
 * guild, e.g. /api/dashboard/verification?guildId=... Every call re-verifies
 * the admin session and re-derives the authorized guild set — the guildId
 * query param is never trusted on its own.
 */
export function createConfigRoute<T>(
  getFn: (guildId: string) => Promise<T>,
  setFn: (guildId: string, data: T) => Promise<unknown>,
  schema: ZodSchema<T>
) {
  async function GET(req: NextRequest) {
    try {
      await requireAdminSession();
      const session = await readSession();
      const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
      const data = await getFn(guildId);
      return NextResponse.json({ data });
    } catch (err) {
      return handleApiError(err);
    }
  }

  async function PUT(req: NextRequest) {
    try {
      await requireAdminSession();
      const session = await readSession();
      const guildId = await requireAuthorizedGuild(session!.discordAccessToken, guildIdFromRequest(req));
      const body = await req.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input.", issues: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const data = await setFn(guildId, parsed.data);
      return NextResponse.json({ data });
    } catch (err) {
      return handleApiError(err);
    }
  }

  return { GET, PUT };
}
