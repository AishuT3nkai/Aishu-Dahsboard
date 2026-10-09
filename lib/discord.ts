import { createHash } from "crypto";
import type { DiscordGuildSummary } from "./types";

const API_BASE = "https://discord.com/api/v10";
const MANAGE_GUILD = 0x20;
const ADMINISTRATOR = 0x8;

export function buildAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    redirect_uri: requireEnv("DISCORD_REDIRECT_URI", "DISCORD_REDIRECT_URL"),
    response_type: "code",
    scope: "identify guilds",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    client_id: requireEnv("DISCORD_CLIENT_ID"),
    client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: requireEnv("DISCORD_REDIRECT_URI", "DISCORD_REDIRECT_URL"),
  });

  const res = await fetch(`${API_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
}

export async function fetchDiscordUser(accessToken: string) {
  const res = await fetch(`${API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch Discord user: ${res.status}`);
  return (await res.json()) as { id: string; username: string; avatar: string | null };
}

/**
 * Short-lived per-token cache for Discord's manageable-guild list.
 *
 * Dashboard pages make several API requests that each need to verify guild
 * access. Without coalescing those requests, a single page load can quickly
 * hit Discord's user-guild rate limit (429). We key the cache by a one-way
 * token hash, never the raw OAuth token. Permissions are revalidated after
 * this short TTL; no stale permissions are used when Discord is unavailable.
 */
const GUILD_CACHE_TTL_MS = 30_000;
const manageableGuildCache = new Map<
  string,
  { expiresAt: number; guilds: DiscordGuildSummary[] }
>();
const manageableGuildRequests = new Map<string, Promise<DiscordGuildSummary[]>>();

/**
 * Guilds the logged-in admin can manage in Discord (Manage Server or
 * Administrator). This is only used to build the candidate list for the
 * guild switcher — it is intersected server-side with the guilds the bot
 * itself reports via the bridge before anything is trusted as "in scope".
 */
export async function fetchManageableGuilds(
  accessToken: string
): Promise<DiscordGuildSummary[]> {
  const cacheKey = createHash("sha256").update(accessToken).digest("hex");
  const cached = manageableGuildCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.guilds.map((guild) => ({ ...guild }));
  }

  const pending = manageableGuildRequests.get(cacheKey);
  if (pending) return (await pending).map((guild) => ({ ...guild }));

  const request = (async () => {
    const res = await fetch(`${API_BASE}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch guilds: ${res.status}`);
    const guilds = (await res.json()) as {
      id: string;
      name: string;
      icon: string | null;
      permissions: string;
    }[];

    const manageable = guilds
      .filter((g) => {
        const perms = BigInt(g.permissions);
        return (perms & BigInt(MANAGE_GUILD)) !== BigInt(0) ||
          (perms & BigInt(ADMINISTRATOR)) !== BigInt(0);
      })
      .map((g) => ({ id: g.id, name: g.name, icon: g.icon }));

    manageableGuildCache.set(cacheKey, {
      expiresAt: Date.now() + GUILD_CACHE_TTL_MS,
      guilds: manageable,
    });
    return manageable;
  })();

  manageableGuildRequests.set(cacheKey, request);
  try {
    return (await request).map((guild) => ({ ...guild }));
  } finally {
    if (manageableGuildRequests.get(cacheKey) === request) {
      manageableGuildRequests.delete(cacheKey);
    }
  }
}

function requireEnv(name: string, ...aliases: string[]): string {
  for (const key of [name, ...aliases]) {
    const value = process.env[key];
    if (value) return value;
  }
  throw new Error(
    `Missing required environment variable: ${[name, ...aliases].join(" or ")}`
  );
}
