# Bot bridge API contract

The dashboard does not open the bot's local SQLite database. Vercel and the bot host do not share a filesystem, and the bot may be writing to the database while the dashboard is running. Instead, the **Aishu Bot process** must expose a private HTTP API (the bridge) that the dashboard calls from server-side route handlers.

The bot repository now contains an authenticated `aiohttp` bridge started with the bot lifecycle. The core route families listed below and the channel/role lookup endpoints are implemented, with stronger input and permission validation. Live calls still require `BOT_API_BASE_URL` and a matching `BOT_API_SHARED_SECRET` to be configured on the dashboard and bot host. A route existing does not prove every stored field is consumed by the bot runtime; the known runtime gaps at the end of this document remain non-live until verified end to end.

## Transport and authentication

- Use HTTPS from Vercel to the bot host. Do not expose the bridge as a public, unauthenticated API.
- Every request from the dashboard sends `Authorization: Bearer <BOT_API_SHARED_SECRET>`. Reject a missing or incorrect secret with `401`.
- Keep secrets out of URLs and logs. Compare shared secrets in constant time where the language/runtime supports it.
- Validate request methods, bodies, IDs, payload sizes, and guild membership in the bridge itself. Dashboard validation is not a replacement for bot-side validation.
- Keep the existing dashboard client's short request timeout in mind; return promptly and use structured JSON error responses.
- Recommended implementation: an `aiohttp` or FastAPI server in the same process as the bot (or a sidecar with direct access to its database), started by the bot's startup lifecycle.

## Guild scoping

Every guild-specific route is namespaced by `:guildId`. The bridge must independently verify that the bot is currently in that guild and reject unknown guild IDs. The dashboard also intersects the signed-in admin's manageable guilds with the bot's guilds; the bridge is the final line of defense and must not trust a path parameter.

## Existing endpoints expected by `lib/bridge.ts`

All paths are relative to `BOT_API_BASE_URL`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds` | List guilds the bot is in: `{id, name, memberCount}[]` |
| GET | `/api/guilds/:id/overview` | `OverviewStats` |
| GET / PUT | `/api/guilds/:id/verification` | `VerificationConfig` |
| GET / PUT | `/api/guilds/:id/welcome` | `WelcomeGoodbyeConfig` |
| GET / PUT | `/api/guilds/:id/moderation` | `ModerationConfig` |
| GET / PUT | `/api/guilds/:id/automod` | AutoMod config |
| GET | `/api/guilds/:id/moderation/warnings` | `WarningEntry[]` |
| DELETE | `/api/guilds/:id/moderation/warnings/:warningId` | Clear one warning |
| GET / PUT | `/api/guilds/:id/tickets` | `TicketConfig` |
| GET / PUT | `/api/guilds/:id/suggestions/config` | `SuggestionConfig` |
| GET | `/api/guilds/:id/suggestions` | `SuggestionEntry[]` |
| POST | `/api/guilds/:id/suggestions/:suggestionId/decide` | Body: `{decision: "approved"|"denied", note?}` |
| GET / PUT | `/api/guilds/:id/reports/config` | `ReportConfig` |
| GET | `/api/guilds/:id/reports` | `ReportEntry[]` |
| POST | `/api/guilds/:id/reports/:reportId/close` | Close a report |
| GET / PUT | `/api/guilds/:id/birthday` | `BirthdayConfig` |
| GET / PUT | `/api/guilds/:id/autorole` | `AutoroleConfig` |
| GET / PUT | `/api/guilds/:id/leveling/config` | `LevelingConfig` |
| GET / PUT | `/api/guilds/:id/leveling/rewards` | `LevelRewardEntry[]` |
| GET | `/api/guilds/:id/leveling/users?search=` | Ranked `LevelingUserEntry[]` |
| PUT | `/api/guilds/:id/leveling/users/:userId` | Body: `{xp: number}` |
| POST | `/api/guilds/:id/leveling/users/:userId/reset` | Reset member XP to zero |
| GET | `/api/guilds/:id/languages` | `LanguageStats` |
| GET / PUT | `/api/guilds/:id/server` | `ServerConfig` |

The canonical response shapes live in `lib/types.ts`. PUT bodies are validated with Zod by the dashboard, but the bridge must validate independently. Use the existing bot's database patterns and migrations; do not create parallel data that the bot never reads.

## Additional feature status

### Channel and role lookup — implemented in the bot bridge

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds/:id/channels` | Selectable text/announcement channels with `id`, `name`, and `type`; channels the bot cannot view and send in are omitted |
| GET | `/api/guilds/:id/roles` | Selectable roles with `id`, `name`, `position`, and `managed`; @everyone, integration-managed roles, and roles at/above the bot's top role are excluded |

The dashboard now has authenticated server-side lookup routes at `/api/dashboard/channels?guildId=...` and `/api/dashboard/roles?guildId=...`. Keep manual-ID fields until selectors are wired to these routes. The bot bridge independently validates submitted channel/role IDs and role hierarchy.

### Advanced anti-raid — draft-only

The verification page's advanced anti-raid controls are stored only in browser local storage. Do not add a live save endpoint or display them as active protection until the bot enforces the complete policy in join/verification events: captcha, quarantine, account-age gate, join-rate threshold/window, minimum account age, verification timeout, and attempt limit. The bot's existing anti-raid cog currently implements its own join-rate lockdown policy; that is not equivalent to the complete dashboard policy.

### Webhook management — draft-only

No live webhook management endpoints are enabled yet. The UI must continue to state that values are previews/drafts and must not claim that a webhook is saved, tested, or delivering events.

Before enabling webhook endpoints, implement all of the following server-side:
- Allowlisted event names and HTTPS-only endpoint URLs.
- SSRF protection for public DNS resolution, private/link-local/reserved IP ranges, redirects, and DNS rebinding.
- Encrypted endpoint secrets at rest; never return them in API responses.
- Signed payloads, bounded request timeouts, retry/backoff, per-guild rate limits, and redacted delivery logs.
- Ownership checks for update/delete/test operations and redacted delivery history.

## Known integration gaps

- The bridge requires a strong shared secret and a private HTTPS path from Vercel to the bot host. Never expose the raw bridge port publicly.
- Some fields currently stored in the bridge's generic configuration table (for example, custom welcome text, ticket templates, birthday announcement format, leveling policy/rewards, and server prefix) must be checked against the actual bot runtime before being called live. A successful database write alone is not proof the bot uses the value.
- Leveling requires verified bot-side XP update logic, reward assignment, and rank/leaderboard behavior. Keep controls that are not connected to runtime behavior clearly marked until tested end to end.
- Advanced anti-raid settings remain browser-only drafts until full policy enforcement exists.
- Webhook management remains draft-only until secure storage, event subscriptions, signing, delivery retry/backoff, SSRF protection, rate limits, and redacted operational logs are implemented.
- Dashboard equivalents should only replace or disable existing Discord setup/panel commands after the corresponding bridge-backed feature has been verified end to end.
