# Bot bridge API contract

The dashboard does not open the bot's local SQLite database. Vercel and the bot host do not share a filesystem, and the bot may be writing to the database while the dashboard is running. Instead, the **Aishu Bot process** must expose a private HTTP API (the bridge) that the dashboard calls from server-side route handlers.

As of October 2026, this bridge has **not yet been implemented in `AishuT3nkai/Aishu-Bot`**. Until it exists and `BOT_API_BASE_URL` / `BOT_API_SHARED_SECRET` are configured correctly, configuration pages must continue to show an unavailable/error state rather than inventing or pretending to save real bot settings.

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

## Additional bridge contract needed to finish dashboard features

These are **requirements to implement before the matching dashboard controls can be called live**. They are not currently implemented by this dashboard repo or the bot.

### Channel and role lookup

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds/:id/channels` | Return selectable text/announcement channels with `id`, `name`, and `type`; omit channels the bot cannot use |
| GET | `/api/guilds/:id/roles` | Return selectable roles with `id`, `name`, `position`, and `managed`; exclude @everyone and integration-managed roles from assignment |

The bridge must check guild membership and permissions and must never let a submitted channel/role ID bypass those checks.

### Advanced anti-raid

| Method | Path | Purpose |
|---|---|---|
| GET / PUT | `/api/guilds/:id/anti-raid` | Read/write a validated per-guild policy: enabled, captcha, quarantine, account-age gate, join-rate threshold/window, minimum account age, verification timeout, and attempt limit |

The bot must enforce this policy in actual join/verification events. Persisting the values alone is not enforcement. Until that work exists, the UI must label these values as local drafts and must not suggest that protection is active.

### Webhook management

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds/:id/webhooks` | Return configured webhook metadata and subscribed event names; never return stored endpoint secrets |
| POST | `/api/guilds/:id/webhooks` | Validate an HTTPS endpoint and event allowlist, then store the secret securely server-side |
| PATCH | `/api/guilds/:id/webhooks/:webhookId` | Update endpoint/events or enable state after ownership checks |
| DELETE | `/api/guilds/:id/webhooks/:webhookId` | Disable and remove a webhook configuration |
| POST | `/api/guilds/:id/webhooks/:webhookId/test` | Send an explicitly requested test event and return a redacted delivery result |
| GET | `/api/guilds/:id/webhooks/:webhookId/deliveries` | Return redacted delivery status, attempt count, and timestamps; never include endpoint secrets or full sensitive payloads |

Webhook delivery must use signed payloads, bounded timeouts, retries with backoff, SSRF protection (including blocking private/link-local/reserved IP ranges and re-validating redirects/DNS), secret encryption at rest, rate limits, and redacted logs. Never let a webhook endpoint target internal metadata services or arbitrary private network hosts.

## Known integration gaps

- **The bridge itself is absent.** Every live read/write in the dashboard depends on the endpoints above.
- **Leveling persistence and runtime behavior** require bot-side tables, XP update logic, rewards, and any intended rank/leaderboard commands.
- **Per-guild configuration persistence** is required for verification, welcome/goodbye, moderation, tickets, suggestions, reports, birthday, autorole, AutoMod, and server settings.
- **Channel and role lookup endpoints** must be added before replacing manual-ID fields with selectors.
- **Webhook management** remains draft-only until secure storage, event subscriptions, signing, delivery retry/backoff, SSRF protection, and redacted operational logs are implemented.
- **Advanced anti-raid settings** are browser-only drafts until bridge-backed persistence and bot enforcement exist.
- Dashboard equivalents should only replace or disable existing Discord setup/panel commands after the corresponding bridge-backed feature has been verified end to end.
