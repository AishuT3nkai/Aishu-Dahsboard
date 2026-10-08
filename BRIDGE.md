# Bot bridge API contract

The dashboard never opens the bot's local `aishu.db` SQLite file directly —
Vercel and the Nexus Host bot process don't share a filesystem, and the bot
is actively writing to that file while running. Instead, the **Aishu Bot
process itself** must expose a small private HTTP API ("the bridge") that
the dashboard calls server-side only.

This file does not exist in `AishuT3nkai/Aishu-Bot` yet. Until it's added
and `BOT_API_BASE_URL` / `BOT_API_SHARED_SECRET` are set on the dashboard
deployment, every dashboard config page will show "bridge not configured"
instead of pretending to load or save real data.

## Transport

- Plain HTTP(S) JSON API, reachable from Vercel (a Nexus Host public port,
  or a tunnel — your call).
- Every request from the dashboard includes `Authorization: Bearer
  <BOT_API_SHARED_SECRET>`. Reject anything else with `401`.
- This endpoint should **not** be advertised or documented publicly — it's
  equivalent in sensitivity to direct database access.
- Recommended: run it as an `aiohttp` or FastAPI server inside the same
  process as the bot (or a sidecar with direct access to `utils/database.py`),
  started from `bot.py`'s `setup_hook`.

## Guild scoping

Every route below is namespaced by `:guildId` in the path. The bridge should
independently verify the bot is actually in that guild — the dashboard
already restricts which guild IDs it will ever send, but the bridge is the
last line of defense and should not trust the path blindly either.

## Endpoints expected by `lib/bridge.ts`

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/guilds` | List every guild the bot is currently in: `{id, name, memberCount}[]` |
| GET | `/api/guilds/:id/overview` | `OverviewStats` (see `lib/types.ts`) |
| GET / PUT | `/api/guilds/:id/verification` | `VerificationConfig` |
| GET / PUT | `/api/guilds/:id/welcome` | `WelcomeGoodbyeConfig` |
| GET / PUT | `/api/guilds/:id/moderation` | `ModerationConfig` |
| GET | `/api/guilds/:id/moderation/warnings` | `WarningEntry[]` |
| DELETE | `/api/guilds/:id/moderation/warnings/:warningId` | Clear one warning |
| GET / PUT | `/api/guilds/:id/tickets` | `TicketConfig` |
| GET / PUT | `/api/guilds/:id/suggestions/config` | `SuggestionConfig` |
| GET | `/api/guilds/:id/suggestions` | `SuggestionEntry[]` |
| POST | `/api/guilds/:id/suggestions/:suggestionId/decide` | body `{decision: "approved"\|"denied", note?}` |
| GET / PUT | `/api/guilds/:id/reports/config` | `ReportConfig` |
| GET | `/api/guilds/:id/reports` | `ReportEntry[]` |
| POST | `/api/guilds/:id/reports/:reportId/close` | Close a report |
| GET / PUT | `/api/guilds/:id/birthday` | `BirthdayConfig` |
| GET / PUT | `/api/guilds/:id/autorole` | `AutoroleConfig` |
| GET / PUT | `/api/guilds/:id/leveling/config` | `LevelingConfig` |
| GET / PUT | `/api/guilds/:id/leveling/rewards` | `LevelRewardEntry[]` |
| GET | `/api/guilds/:id/leveling/users?search=` | `LevelingUserEntry[]`, ranked |
| PUT | `/api/guilds/:id/leveling/users/:userId` | body `{xp: number}` |
| POST | `/api/guilds/:id/leveling/users/:userId/reset` | Reset a member's XP to 0 |
| GET | `/api/guilds/:id/languages` | `LanguageStats` |
| GET / PUT | `/api/guilds/:id/server` | `ServerConfig` |

Exact shapes are defined in `dashboard/lib/types.ts` — treat that file as the
schema. PUT bodies are already validated with Zod on the dashboard side
before they reach the bridge, but the bridge should still validate
independently rather than trusting the network.

## Notable gaps this implies on the bot side

- **Leveling doesn't exist in the bot yet at all** — no cog, no
  `leveling_config` / `leveling_users` / `leveling_rewards` tables, no
  `/rank /level /leaderboard /xp` commands. The dashboard's Leveling page is
  built and ready to talk to this API once it exists.
- **Per-guild config storage**: `verification`, `welcome/goodbye`,
  `moderation`, `tickets`, `birthday`, `autorole`, and `server` config
  presumably need a `guild_config` table (or one table per feature) keyed by
  `guild_id`, if one doesn't already exist in `utils/database.py`.
- **Setup/panel commands currently live in Discord** (`/verification setup`,
  `/welcome setup`, `/goodbye setup`, `/ticket setup`/`panel`, `/config
  channel/autorole/view`, `/suggestion approve/deny`, `/reports close`, per
  the bot's own README) should be deregistered from their cogs once the
  dashboard equivalents are backed by this bridge, per the dashboard brief.
  That's a bot-side change, not made here.
