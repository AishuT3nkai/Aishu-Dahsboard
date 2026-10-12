# Bot bridge API contract

## Current implementation status (October 2026)

The bot-side bridge **exists** in `AishuT3nkai/Aishu-Bot/bridge.py` and is built with `aiohttp`. It is started by the bot lifecycle when `BOT_API_SHARED_SECRET` is configured. It authenticates requests with a Bearer secret, uses constant-time comparison, checks that requested guilds are available to the bot, and persists several dashboard settings in the bot's SQLite database.

This is a **partial implementation**, not a finished end-to-end integration. The bridge currently implements the guild overview, verification, welcome/goodbye, moderation settings and warnings, tickets, suggestions, reports, birthday, autorole, leveling configuration/rewards/users, language statistics, server settings, and AutoMod endpoints listed below. It does **not** yet implement channel/role lookup, advanced anti-raid, or webhook management endpoints. Do not label a dashboard feature live until its API and runtime behavior have been checked end to end.

The dashboard must never read the bot's SQLite file directly: Vercel and the bot host do not share a filesystem, and the bot may be writing to the database while the dashboard runs. All bot-state reads and writes must go through the server-side client in `lib/bridge.ts`.

## Transport and authentication

- Set `BOT_API_BASE_URL` and `BOT_API_SHARED_SECRET` in the dashboard deployment. The bridge process requires the same shared secret.
- Use HTTPS from Vercel to the bot host. The dashboard client only permits plain HTTP for loopback development URLs.
- Every dashboard request sends `Authorization: Bearer <BOT_API_SHARED_SECRET>`. Reject missing or incorrect secrets with `401`.
- Keep secrets out of URLs and logs. Compare shared secrets in constant time where supported.
- Validate request methods, JSON bodies, IDs, payload sizes, and guild membership in the bridge itself. Dashboard-side Zod validation is an additional layer, not a replacement for bot-side validation.
- The dashboard client uses an 8-second timeout and redacts upstream response bodies from errors. Keep bridge responses prompt and return structured JSON errors.
- The bridge currently defaults to listening on `0.0.0.0:8080`. Restrict network access at the host/firewall/reverse proxy so the service is not exposed as an unauthenticated public API; the shared secret is required but should not be the only network boundary.
- Every guild-specific route is namespaced by `:guildId`. The bridge must independently verify the bot is in that guild and reject unknown IDs. Never trust a path parameter or dashboard validation as the final authorization check.

## Implemented endpoints

All paths are relative to `BOT_API_BASE_URL`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Bridge health metadata |
| GET | `/api/guilds` | Guilds the bot is in: `{id, name, memberCount}[]` |
| GET | `/api/guilds/:id/overview` | Overview counts and bot status |
| GET / PUT | `/api/guilds/:id/verification` | Verification settings |
| GET / PUT | `/api/guilds/:id/welcome` | Welcome/goodbye settings and message templates |
| GET / PUT | `/api/guilds/:id/moderation` | Moderation log and mute-role settings |
| GET / PUT | `/api/guilds/:id/automod` | AutoMod policy |
| GET | `/api/guilds/:id/moderation/warnings` | Warning history |
| DELETE | `/api/guilds/:id/moderation/warnings/:warningId` | Clear a warning |
| GET / PUT | `/api/guilds/:id/tickets` | Ticket category, support role, naming pattern, and opening message |
| GET / PUT | `/api/guilds/:id/suggestions/config` | Suggestion channel |
| GET | `/api/guilds/:id/suggestions` | Suggestion list |
| POST | `/api/guilds/:id/suggestions/:suggestionId/decide` | Decide a suggestion; body `{decision: "approved"|"denied", note?}` |
| GET / PUT | `/api/guilds/:id/reports/config` | Report channel |
| GET | `/api/guilds/:id/reports` | Report list |
| POST | `/api/guilds/:id/reports/:reportId/close` | Close a report |
| GET / PUT | `/api/guilds/:id/birthday` | Birthday announcement settings |
| GET / PUT | `/api/guilds/:id/autorole` | Autorole settings |
| GET / PUT | `/api/guilds/:id/leveling/config` | Leveling configuration |
| GET / PUT | `/api/guilds/:id/leveling/rewards` | Level-reward role list |
| GET | `/api/guilds/:id/leveling/users?search=` | XP/level leaderboard, optionally filtered |
| PUT | `/api/guilds/:id/leveling/users/:userId` | Set a user's XP; body `{xp: number}` |
| POST | `/api/guilds/:id/leveling/users/:userId/reset` | Reset a user's XP and level |
| GET | `/api/guilds/:id/languages` | Language preference statistics |
| GET / PUT | `/api/guilds/:id/server` | Server prefix and moderation-log channel |

Canonical dashboard response types are in `lib/types.ts`; route schemas should remain consistent with those types and the actual bot response payloads. Configuration persistence does not by itself prove a feature's runtime behavior is active.

## Missing endpoints required for planned dashboard features

### Channel and role lookup

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds/:id/channels` | Selectable channels with `id`, `name`, and `type`; omit channels the bot cannot use |
| GET | `/api/guilds/:id/roles` | Selectable roles with `id`, `name`, `position`, and `managed`; exclude @everyone and integration-managed roles from assignment |

The bridge must verify guild membership and permissions and must not let submitted IDs bypass those checks. Until these endpoints exist, pages may use validated ID fields only if that UX is clearly explained; do not fake populated selectors.

### Advanced anti-raid

| Method | Path | Purpose |
|---|---|---|
| GET / PUT | `/api/guilds/:id/anti-raid` | Persist a validated per-guild policy: enabled, captcha, quarantine, account-age gate, join-rate threshold/window, minimum account age, verification timeout, and attempt limit |

The bot must enforce this policy in actual join/verification events. Persisting values alone is not enforcement. Until verified, controls must be labeled as drafts and must not imply protection is active.

### Webhook management

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds/:id/webhooks` | Return webhook metadata and subscribed events; never return stored secrets |
| POST | `/api/guilds/:id/webhooks` | Validate an HTTPS endpoint and event allowlist, then securely store the secret |
| PATCH | `/api/guilds/:id/webhooks/:webhookId` | Update endpoint/events or enabled state after ownership checks |
| DELETE | `/api/guilds/:id/webhooks/:webhookId` | Disable/remove a webhook configuration |
| POST | `/api/guilds/:id/webhooks/:webhookId/test` | Send an explicitly requested test event and return a redacted result |
| GET | `/api/guilds/:id/webhooks/:webhookId/deliveries` | Return redacted delivery status, attempts, and timestamps |

Webhook delivery must use signed payloads, bounded timeouts, retries with backoff, SSRF protection (including private/link-local/reserved IP blocking and re-validating redirects/DNS), encrypted secrets at rest, rate limits, and redacted logs. Never permit endpoints to target internal metadata services or arbitrary private-network hosts.

## Integration and security checklist

- [ ] Confirm the deployment's bridge URL and shared secret are configured without exposing either in client-side code or logs.
- [ ] Verify every dashboard route maps to an implemented bridge route with matching method, payload, and response shape.
- [ ] Validate every field in the bot bridge, including leveling configuration/rewards and user IDs; reject malformed IDs cleanly rather than returning a 500.
- [ ] Verify submitted user IDs belong to the target guild where a member-only action is intended.
- [ ] Check permissions and bot role hierarchy before assigning roles or changing channels.
- [ ] Confirm settings are consumed by the actual bot runtime and survive a restart.
- [ ] Keep unavailable features visibly unavailable; never present a browser-only draft as saved or active.
- [ ] Add channel/role lookup, anti-raid, and webhook APIs only alongside server-side validation, authorization, persistence, and tests.
- [ ] Do not replace or disable Discord setup/panel commands until the corresponding dashboard feature has passed end-to-end verification.
