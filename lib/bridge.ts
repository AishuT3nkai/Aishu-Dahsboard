/**
 * The bridge is the ONLY way the dashboard touches bot state. It never
 * reads the bot's local SQLite file directly (Vercel and the bot process
 * don't even share a filesystem). Instead the Aishu Bot process, running
 * on Nexus Host, exposes a small authenticated HTTP API described in
 * dashboard/BRIDGE.md, and this file is the client for it.
 *
 * That bot-side HTTP API does not exist yet in AishuT3nkai/Aishu-Bot as of
 * this build. Until BOT_API_BASE_URL / BOT_API_SHARED_SECRET are set and
 * the bot exposes those routes, every call here fails loudly with
 * BridgeNotConfiguredError rather than returning fake "saved" data.
 */

export class BridgeNotConfiguredError extends Error {
  constructor() {
    super(
      "The bot bridge is not configured (BOT_API_BASE_URL / BOT_API_SHARED_SECRET). " +
        "This dashboard control has no live bot to save to yet — see dashboard/BRIDGE.md."
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
  const baseUrl = process.env.BOT_API_BASE_URL;
  const secret = process.env.BOT_API_SHARED_SECRET;
  if (!baseUrl || !secret) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), secret };
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
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...rest,
    method: rest.method ?? (json ? "POST" : "GET"),
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new BridgeRequestError(res.status, `Bridge ${path} -> ${res.status}: ${text}`);
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
    bridgeFetch(`/api/guilds/${guildId}/overview`),

  // --- Verification ---
  getVerification: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/verification`),
  setVerification: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/verification`, { method: "PUT", json: data }),

  // --- Welcome / Goodbye / Autorole ---
  getWelcomeGoodbye: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/welcome`),
  setWelcomeGoodbye: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/welcome`, { method: "PUT", json: data }),

  // --- Moderation ---
  getModerationConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/moderation`),
  setModerationConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/moderation`, { method: "PUT", json: data }),
  listWarnings: (guildId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/moderation/warnings`),
  clearWarning: (guildId: string, warningId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/moderation/warnings/${warningId}`, {
      method: "DELETE",
    }),

  // --- Tickets ---
  getTicketConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/tickets`),
  setTicketConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/tickets`, { method: "PUT", json: data }),

  // --- Suggestions ---
  getSuggestionConfig: (guildId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/suggestions/config`),
  setSuggestionConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/suggestions/config`, { method: "PUT", json: data }),
  listSuggestions: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/suggestions`),
  decideSuggestion: (
    guildId: string,
    suggestionId: string,
    decision: "approved" | "denied",
    note?: string
  ) =>
    bridgeFetch(`/api/guilds/${guildId}/suggestions/${suggestionId}/decide`, {
      json: { decision, note },
    }),

  // --- Reports ---
  getReportConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/reports/config`),
  setReportConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/reports/config`, { method: "PUT", json: data }),
  listReports: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/reports`),
  closeReport: (guildId: string, reportId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/reports/${reportId}/close`, { json: {} }),

  // --- Birthday ---
  getBirthdayConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/birthday`),
  setBirthdayConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/birthday`, { method: "PUT", json: data }),

  // --- Autorole ---
  getAutoroleConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/autorole`),
  setAutoroleConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/autorole`, { method: "PUT", json: data }),

  // --- Leveling ---
  getLevelingConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/leveling/config`),
  setLevelingConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/leveling/config`, { method: "PUT", json: data }),
  listLevelRewards: (guildId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/leveling/rewards`),
  setLevelRewards: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/leveling/rewards`, { method: "PUT", json: data }),
  listLevelingUsers: (guildId: string, query?: string) =>
    bridgeFetch(
      `/api/guilds/${guildId}/leveling/users${query ? `?search=${encodeURIComponent(query)}` : ""}`
    ),
  setUserXp: (guildId: string, userId: string, xp: number) =>
    bridgeFetch(`/api/guilds/${guildId}/leveling/users/${userId}`, { method: "PUT", json: { xp } }),
  resetUserXp: (guildId: string, userId: string) =>
    bridgeFetch(`/api/guilds/${guildId}/leveling/users/${userId}/reset`, { json: {} }),

  // --- Languages ---
  getLanguageStats: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/languages`),

  // --- Server config ---
  getServerConfig: (guildId: string) => bridgeFetch(`/api/guilds/${guildId}/server`),
  setServerConfig: (guildId: string, data: unknown) =>
    bridgeFetch(`/api/guilds/${guildId}/server`, { method: "PUT", json: data }),
};
