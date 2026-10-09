# Aishu Bot Dashboard

A private, two-admin-only dashboard for Aishu Bot. This is a **standalone Next.js repository**: `package.json`, `app/`, `components/`, and `lib/` live at the repository root.

## Features in the dashboard

- Discord OAuth2 sign-in with a strict two-user ID allowlist (`ADMIN_USER_ID_1` / `ADMIN_USER_ID_2`). Discord server permissions do not grant dashboard access.
- Server-side guild scoping: a guild must be manageable by the signed-in admin and present in the bot's guild list before the dashboard accepts it.
- Pages for overview, verification, welcome/goodbye, moderation, tickets, suggestions, reports, birthday, auto role, AutoMod, leveling, languages, server settings, command documentation, and webhook drafts.
- A bridge client (`lib/bridge.ts`) that makes server-side authenticated calls to the bot. The dashboard never reads the bot's SQLite database directly.

## Current integration status

The dashboard UI and its server-side API routes are implemented, but **the dashboard is not yet end-to-end complete** until the matching HTTP bridge and feature storage are implemented by the bot. Until that bridge returns real data, the app intentionally reports that the bridge is unavailable rather than displaying fake settings.

| Area | Current status |
|---|---|
| Login and route protection | Discord OAuth, admin allowlist, signed HttpOnly session cookie, and default-protected routes are implemented. |
| Configuration pages | UI and validation/API adapters are present; live reads and writes require the bot bridge. |
| Advanced anti-raid controls | Browser-only drafts per guild; not applied to the live bot. |
| Webhooks | Draft-only preview. No endpoint URL is saved, and no delivery is sent. Do not paste production secrets here. |
| Channel/role picking | Enter IDs manually for now; the bridge contract does not yet expose channel/role listing. |
| Bot bridge / leveling persistence | Requires bot-side implementation and live integration tests. See `BRIDGE.md`. |

## Required environment variables

Copy `.env.example` to `.env.local` and fill in the values locally. Configure matching values in Vercel for the environments that will be used.

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth2 application credentials |
| `DISCORD_REDIRECT_URI` | Must exactly match the callback URL registered in Discord, e.g. `https://your-domain.example/api/auth/callback` |
| `ADMIN_USER_ID_1` / `ADMIN_USER_ID_2` | The only Discord accounts allowed to sign in |
| `ADMIN_GUILD_ID` | Optional: pin the dashboard to one guild |
| `DASHBOARD_SESSION_SECRET` | Long random secret used to sign session cookies; generate with `openssl rand -hex 32` |
| `BOT_API_BASE_URL` / `BOT_API_SHARED_SECRET` | Private bot bridge URL and shared secret; see `BRIDGE.md` |

The OAuth request uses the `identify guilds` scopes. Add the exact callback URL to the Discord Developer Portal.

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in .env.local, then:
npm run dev
```

Validation commands:

```bash
npm run lint
npm run typecheck
npm run build
```

The repository's GitHub Actions workflow runs these checks for pushes and pull requests to `main`.

## Deploy to Vercel

1. Import `AishuT3nkai/Aishu-Dahsboard` as a standalone project.
2. Use the repository root as the Vercel Root Directory (leave it blank/default); `package.json` is at the root, not inside a `dashboard/` folder.
3. Add the environment variables above to the appropriate Vercel environments.
4. Set `DISCORD_REDIRECT_URI` to `https://<your-vercel-domain>/api/auth/callback` and register the same URL in the Discord Developer Portal.
5. Deploy, then test OAuth login with each authorized account and verify that protected routes redirect to `/login` when signed out.

## Before calling the integration complete

- Implement and secure the bot bridge described in `BRIDGE.md` on the bot host.
- Verify every bridge read/write against real per-guild storage and bot permissions.
- Add real channel/role lookup endpoints before replacing the manual-ID fields with selectors.
- Implement secure server-side webhook configuration storage, delivery retries, and redacted logs before enabling webhook delivery.
- Move advanced anti-raid drafts from browser-only storage into validated bridge-backed persistence.
- Review and remediate the outstanding npm audit findings without forcing breaking dependency upgrades.

The production deployment has passed the Vercel Next.js production build and TypeScript validation for the dashboard code as of October 2026. This confirms the web app can build and launch, **not** that the bot bridge or every live bot feature has been completed.
