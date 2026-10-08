# Aishu Bot — Dashboard

Private, two-admin-only configuration dashboard for Aishu Bot. Next.js 14
(App Router) + TypeScript, deployed as `dashboard/` per the bot repo's own
README (Vercel root directory = `dashboard`).

## What this is

- Discord OAuth2 login, gated to exactly two Discord user IDs
  (`ADMIN_USER_ID_1` / `ADMIN_USER_ID_2`) — Discord Administrator/Manage
  Server permissions are never consulted for dashboard access.
- Server-side guild scoping: the guild switcher only ever shows guilds where
  the logged-in admin *and* the bot are both present, and every API route
  re-derives and re-checks that intersection — a guild ID from the browser
  is never trusted on its own.
- Config pages for verification, welcome/goodbye, moderation, tickets,
  suggestions, reports, birthday, auto role, leveling, languages, and
  server-wide settings, plus a full command-info/documentation page.
- A **bot bridge client** (`lib/bridge.ts`) instead of direct database
  access. See `BRIDGE.md` for the API the bot must expose.

## Required environment variables

See `.env.example`. Summary:

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth2 app |
| `DISCORD_REDIRECT_URI` | Must exactly match a redirect URL registered in the Discord Developer Portal |
| `ADMIN_USER_ID_1` / `ADMIN_USER_ID_2` | The two Discord user IDs allowed into the dashboard |
| `ADMIN_GUILD_ID` | Optional — pin the dashboard to one guild instead of showing a switcher |
| `DASHBOARD_SESSION_SECRET` | Random string (`openssl rand -hex 32`) used to sign session cookies |
| `BOT_API_BASE_URL` / `BOT_API_SHARED_SECRET` | The bot's bridge API — see `BRIDGE.md`. Not part of the original spec's env var list; added because the "secure bridge" requirement needs *something* to authenticate against |

In the Discord Developer Portal, add the exact `DISCORD_REDIRECT_URI` as an
OAuth2 redirect and request the `identify guilds` scopes.

## Run locally

```bash
cd dashboard
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Without `BOT_API_BASE_URL`/`BOT_API_SHARED_SECRET` set, login and the guild
switcher work (they only need Discord OAuth + the allowlist), but every
config page will show "bridge not configured" instead of data — this is
intentional per the no-fake-config requirement, not a bug.

## Deploy to Vercel

1. Push this repo (with `dashboard/` at the path shown) to
   `AishuT3nkai/Aishu-Bot`.
2. In Vercel: New Project → import the repo → set **Root Directory** to
   `dashboard`, framework preset **Next.js**.
3. Add all the environment variables above in Vercel's project settings
   (Production + Preview as needed).
4. Set `DISCORD_REDIRECT_URI` to `https://<your-vercel-domain>/api/auth/callback`
   and register that same URL in the Discord Developer Portal.
5. Deploy.

## What still requires the bot / Nexus Host side

- The bridge HTTP API itself (`BRIDGE.md`) — does not exist yet.
- A leveling cog + `leveling_config` / `leveling_users` / `leveling_rewards`
  tables — leveling doesn't exist in the bot at all yet.
- Per-guild config storage in `utils/database.py` for verification,
  welcome/goodbye, moderation, tickets, birthday, autorole, and server
  config, if it isn't already there.
- Deregistering the setup/panel Discord commands the bot's own README
  currently documents as live (`/verification setup`, `/welcome setup`,
  `/goodbye setup`, `/ticket setup`/`panel`, `/config ...`, `/suggestion
  approve/deny`, `/reports close`) once their dashboard equivalents are
  wired up — see the note on each in Dashboard → Command info.

## Architectural limitations / notes

- This build was produced without the ability to `npm install` or run a
  real Next.js build (no network access in that environment), so it has
  been written carefully by hand and reviewed, but **has not been
  build-tested**. Run `npm run build` and `npm run typecheck` before
  deploying and fix anything that surfaces — most likely candidates are
  minor type mismatches in the newer `app/api/**/[param]/route.ts` handlers
  (Next.js route param typing has shifted between minor versions).
- The session cookie is a signed (not encrypted) JWT. It's httpOnly +
  Secure + SameSite=Lax, which is adequate given the two-admin scope, but
  for stronger hardening consider switching to JWE (`jose` supports this)
  so the Discord access token inside it isn't even structurally readable.
- Two-user-only access, per-guild-scoped state, and no public signup path
  mean this is intentionally not built for multi-tenant or larger-team use.

## Tests performed

None — no network access was available in the environment this was built
in to run `npm install`, `next build`, `next lint`, or `tsc --noEmit`. Treat
this as a careful, hand-reviewed first draft that needs a real build pass,
not a verified-working build. Run and fix, in order:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
