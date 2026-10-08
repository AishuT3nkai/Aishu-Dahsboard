import { NextResponse } from "next/server";
import { readSession, isAuthorizedAdmin } from "./session";
import { fetchManageableGuilds } from "./discord";
import { bridge, BridgeNotConfiguredError, BridgeRequestError } from "./bridge";
import type { DiscordGuildSummary } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Verifies the session cookie AND re-checks the two-ID allowlist on every call. */
export async function requireAdminSession() {
  const session = await readSession();
  if (!session || !isAuthorizedAdmin(session.sub)) {
    throw new ApiError(401, "Not authenticated as an authorized dashboard admin.");
  }
  return session;
}

/**
 * Resolves the set of guilds this admin is actually allowed to configure:
 * the intersection of (a) guilds the bot reports it is in, and (b) guilds
 * the logged-in admin can manage in Discord — narrowed to ADMIN_GUILD_ID
 * if that env var is set. A guild ID from the client is only ever trusted
 * after being checked against this list.
 */
export async function authorizedGuildsFor(
  discordAccessToken: string
): Promise<DiscordGuildSummary[]> {
  const [botGuilds, userGuilds] = await Promise.all([
    bridge.listBotGuilds().catch((err) => {
      if (err instanceof BridgeNotConfiguredError) return [];
      throw err;
    }),
    fetchManageableGuilds(discordAccessToken),
  ]);

  const botGuildIds = new Set(botGuilds.map((g) => g.id));
  const pinned = process.env.ADMIN_GUILD_ID;

  return userGuilds.filter((g) => {
    if (!botGuildIds.has(g.id)) return false;
    if (pinned && g.id !== pinned) return false;
    return true;
  });
}

export async function requireAuthorizedGuild(
  discordAccessToken: string,
  guildId: string | null
): Promise<string> {
  if (!guildId) throw new ApiError(400, "Missing guildId.");
  const authorized = await authorizedGuildsFor(discordAccessToken);
  if (!authorized.some((g) => g.id === guildId)) {
    throw new ApiError(403, "You are not authorized to manage this guild.");
  }
  return guildId;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof BridgeNotConfiguredError) {
    return NextResponse.json({ error: err.message, code: "BRIDGE_NOT_CONFIGURED" }, { status: 503 });
  }
  if (err instanceof BridgeRequestError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  console.error(err);
  return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
}
