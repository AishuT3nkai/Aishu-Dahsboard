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
 * Guilds the logged-in admin can manage in Discord (Manage Server or
 * Administrator). This is only used to build the candidate list for the
 * guild switcher — it is intersected server-side with the guilds the bot
 * itself reports via the bridge before anything is trusted as "in scope".
 */
export async function fetchManageableGuilds(
  accessToken: string
): Promise<DiscordGuildSummary[]> {
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

  return guilds
    .filter((g) => {
      const perms = BigInt(g.permissions);
      return (perms & BigInt(MANAGE_GUILD)) !== BigInt(0) ||
        (perms & BigInt(ADMINISTRATOR)) !== BigInt(0);
    })
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon }));
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
