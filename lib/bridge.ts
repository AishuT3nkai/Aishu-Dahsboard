/**
 * The bridge is the ONLY way the dashboard touches bot state. It never
 * reads the bot's local SQLite file directly (Vercel and the bot process
 * don't even share a filesystem). Instead the Aishu Bot process, running
 * on Nexus Host, exposes a small authenticated HTTP API described in
 * BRIDGE.md, and this file is the client for it.
 *
 * The bot-side HTTP API is implemented in AishuT3nkai/Aishu-Bot. Configure
 * BOT_API_BASE_URL and BOT_API_SHARED_SECRET in the dashboard deployment
 * to enable live reads and writes. Calls fail loudly when not configured.
 */

export class BridgeNotConfiguredError extends Error {
  constructor() {
    super(
      "The bot bridge is not configured (BOT_API_BASE_URL / BOT_API_SHARED_SECRET). " +
        "This dashboard control has no live bot to save to yet — see BRIDGE.md."
    );
    this.name = "BridgeNotConfiguredError";
  }
}

export class BridgeRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "BridgeRequestError";
    this.status = status;
  }
}

function config() {
  const rawBaseUrl = process.env.BOT_API_BASE_URL;
  const secret = process.env.BOT_API_SHARED_SECRET;
  if (!rawBaseUrl || !secret) return null;

  // Never send the shared bridge secret over plain HTTP. Permit HTTP only for
  // loopback development endpoints; deployed bridge URLs must use HTTPS.
  try {
    const parsed = new URL(rawBaseUrl);
    const isLoopback =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]";
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
      return null;
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return { baseUrl: parsed.toString().replace(/\/$/, ""), secret };
  } catch {
    return null;
  }
}

export function isBridgeConfigured(): boolean {
  return config() !== null;
}

async function bridgeFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const cfg = config();
  if (!cfg) throw new BridgeNotConfiguredError();

  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      ...rest,
      method: rest.method ?? (json !== undefined ? "POST" : "GET"),
      headers: {
        Authorization: `Bearer ${cfg.secret}`,
        "Content-Type": "application/json",
        ...rest.headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
      // The bot bridge should be a private, non-public endpoint reachable
      // from Vercel; a short timeout keeps a down bot from hanging requests.
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Do not leak internal hostnames or low-level network error details.
    throw new BridgeRequestError(502, "The bot bridge is unreachable or timed out. Check the bridge service.");
  }

  if (!res.ok) {
    // Never forward upstream response bodies; they may contain private details.
    await res.body?.cancel().catch(() => undefined);
    throw new BridgeRequestError(
      res.status,
      `The bot bridge request failed (${res.status}). Check the bridge service logs.`
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const bridge = {
  // --- Guild scoping ---
  listBotGuilds: () =>
    bridgeFetch<{ id: string; name: string; memberCount: number }[]>("/api/guilds"),

  // --- Overview ---
  getOverview: (guildId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/overview`),

  // --- Verification ---
  getVerification: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/verification`),
  setVerification: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/verification`, { method: "PUT", json: data }),

  // --- Welcome / Goodbye / Autorole ---
  getWelcomeGoodbye: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/welcome`),
  setWelcomeGoodbye: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/welcome`, { method: "PUT", json: data }),

  // --- AutoMod ---
  getAutomodConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/automod`),
  setAutomodConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/automod`, { method: "PUT", json: data }),

  // --- Moderation ---
  getModerationConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/moderation`),
  setModerationConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/moderation`, { method: "PUT", json: data }),
  listWarnings: (guildId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/moderation/warnings`),
  clearWarning: (guildId: string, warningId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/moderation/warnings/${encodeURIComponent(warningId)}`, {
      method: "DELETE",
    }),

  // --- Tickets ---
  getTicketConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/tickets`),
  setTicketConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/tickets`, { method: "PUT", json: data }),

  // --- Suggestions ---
  getSuggestionConfig: (guildId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/suggestions/config`),
  setSuggestionConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/suggestions/config`, { method: "PUT", json: data }),
  listSuggestions: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/suggestions`),
  decideSuggestion: (
    guildId: string,
    suggestionId: string,
    decision: "approved" | "denied",
    note?: string
  ) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/suggestions/${encodeURIComponent(suggestionId)}/decide`, {
      json: { decision, note },
    }),

  // --- Reports ---
  getReportConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/reports/config`),
  setReportConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/reports/config`, { method: "PUT", json: data }),
  listReports: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/reports`),
  closeReport: (guildId: string, reportId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/reports/${encodeURIComponent(reportId)}/close`, { json: {} }),

  // --- Birthday ---
  getBirthdayConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/birthday`),
  setBirthdayConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/birthday`, { method: "PUT", json: data }),

  // --- Autorole ---
  getAutoroleConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/autorole`),
  setAutoroleConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/autorole`, { method: "PUT", json: data }),

  // --- Leveling ---
  getLevelingConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/config`),
  setLevelingConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/config`, { method: "PUT", json: data }),
  listLevelRewards: (guildId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/rewards`),
  setLevelRewards: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/rewards`, { method: "PUT", json: data }),
  listLevelingUsers: (guildId: string, query?: string) =>
    bridgeFetch(
      `/api/guilds/${encodeURIComponent(guildId)}/leveling/users${query ? `?search=${encodeURIComponent(query)}` : ""}`
    ),
  setUserXp: (guildId: string, userId: string, xp: number) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/users/${encodeURIComponent(userId)}`, { method: "PUT", json: { xp } }),
  resetUserXp: (guildId: string, userId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/leveling/users/${encodeURIComponent(userId)}/reset`, { json: {} }),

  // --- Languages ---
  getLanguageStats: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/languages`),

  // --- Server config ---
  getServerConfig: (guildId: string) => bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/server`),
  setServerConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/server`, { method: "PUT", json: data }),

  // --- Webhooks ---
  listWebhooks: (guildId: string) =>
    bridgeFetch<{ id: string; endpointHost: string; events: string[]; enabled: boolean; createdAt: string; updatedAt: string }[]>(
      `/api/guilds/${encodeURIComponent(guildId)}/webhooks`
    ),
  createWebhook: (guildId: string, data: { endpoint: string; events: string[] }) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/webhooks`, { method: "POST", json: data }),
  updateWebhook: (guildId: string, webhookId: string, data: { endpoint?: string; events?: string[]; enabled?: boolean }) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/webhooks/${encodeURIComponent(webhookId)}`, { method: "PATCH", json: data }),
  deleteWebhook: (guildId: string, webhookId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/webhooks/${encodeURIComponent(webhookId)}`, { method: "DELETE" }),
  testWebhook: (guildId: string, webhookId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/webhooks/${encodeURIComponent(webhookId)}/test`, { method: "POST", json: {} }),
  listWebhookDeliveries: (guildId: string, webhookId: string) =>
    bridgeFetch(`/api/guilds/${encodeURIComponent(guildId)}/webhooks/${encodeURIComponent(webhookId)}/deliveries`),

};
