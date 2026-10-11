# Aishu Bot Dashboard

A private, two-admin-only dashboard for Aishu Bot. This is a **standalone Next.js repository**: `package.json`, `app/`, `components/`, and `lib/` live at the repository root.

## Features in the dashboard

- Discord OAuth2 sign-in with a strict two-user ID allowlist (`ADMIN_USER_ID_1` / `ADMIN_USER_ID_2`). Discord server permissions do not grant dashboard access.
- Server-side guild scoping: a guild must be manageable by the signed-in admin and present in the bot's guild list before the dashboard accepts it.
- Pages for overview, verification, welcome/goodbye, moderation, tickets, suggestions, reports, birthday, auto role, AutoMod, leveling, languages, server settings, command documentation, and webhook drafts.
- A bridge client (`lib/bridge.ts`) that makes server-side authenticated calls to the bot. The dashboard never reads the bot's SQLite database directly.

## Current completion status

**The dashboard repository is not yet end-to-end complete.** Its UI, dashboard API adapters, session/authentication, and validation exist, but live bot-backed behavior depends on the private bridge and storage running with the bot. A dashboard-only deployment cannot implement or verify bot runtime behavior by itself.

| Area | Dashboard repository status | External dependency |
|---|---|---|
| Login and route protection | Implemented: Discord OAuth, admin allowlist, encrypted HttpOnly session cookie, and protected dashboard routes | Correct Discord/Vercel environment configuration |
| Configuration pages | UI and validation/API adapters exist | Bridge endpoints and real per-guild persistence |
| Leveling and rewards | UI and dashboard API adapters exist | Bot XP runtime, storage, rewards, and bridge |
| Advanced anti-raid controls | Browser-only drafts per guild; not applied to the live bot | Bridge-backed schema, persistence, and bot enforcement |
| Webhooks | Draft-only preview; endpoint and events are not persisted or delivered | Protected server-side storage, signing, delivery/retries, and redacted logs |
| Channel/role selection | Manual Discord IDs | Authenticated bridge lookups |
| Build/deployment | Must be checked against the latest commit's actual CI/Vercel status; a prior success is not proof that the current commit succeeds | CI and Vercel |

## Dashboard completion checklist (code-only scope)

This checklist separates work already present in this repository from work that is not implemented or cannot be completed without the bot bridge. A checkbox means the code exists in this repository; it does **not** mean the feature has passed end-to-end testing.

### Present in the dashboard repository
- [x] Discord OAuth sign-in and two-account allowlist.
- [x] Encrypted HttpOnly session cookie and protected dashboard routes.
- [x] Shared guild context and server-side guild scoping checks.
- [x] Dashboard shell, sidebar, and feature-page routes.
- [x] Shared configuration form/save patterns and server-side API route adapters.
- [x] Zod validation for supported dashboard API payloads.
- [x] Leveling configuration, reward editor, and member XP management UI/API adapters.
- [x] Webhook management UI and authenticated dashboard API adapters on the feature branch; live delivery still requires the bot bridge, host configuration, and end-to-end verification.
- [x] Documentation of the expected bot bridge API contract.

### Still required in dashboard code
- [ ] Audit every page and API route for consistent loading, empty, error, retry, and save feedback.
- [ ] Complete a route-by-route validation/security review, including malformed guild IDs, request bodies, and authorization assumptions.
- [ ] Add accessible labels, keyboard/focus behavior, and responsive layout checks to all form controls.
- [ ] Finish channel/role selector UI only after authenticated lookup endpoints exist; until then keep manual IDs clearly labeled.
- [ ] Verify webhook management end to end against the deployed bot bridge; keep the UI explicit about disconnected or failed delivery states.
- [ ] Review dependencies and resolve applicable security advisories without introducing unreviewed breaking upgrades.
- [ ] Update this checklist after each real code change; do not mark end-to-end behavior complete from a successful build alone.

### Blocked on bot bridge/runtime work (not dashboard-only)
- [ ] Implement the private authenticated bridge documented in `BRIDGE.md`.
- [ ] Implement and verify real per-guild persistence for configuration features.
- [ ] Implement bot-side leveling XP runtime, reward assignment, and ranking data.
- [ ] Add channel and role lookup endpoints with guild/permission checks.
- [ ] Move advanced anti-raid drafts to bridge-backed storage and enforce the policy in bot join/verification events.
- [ ] Implement secure webhook storage, SSRF defenses, HMAC signing, delivery/retries, and redacted delivery logs.
- [ ] Run end-to-end checks against the real bridge and bot after the dashboard code is ready.

## Required environment variables

Copy `.env.example` to `.env.local` and fill in the values locally. Configure matching values in Vercel for the environments that will be used.

| Variable | Purpose |
|---|---|
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth2 application credentials |
| `DISCORD_REDIRECT_URI` | Must exactly match the callback URL registered in Discord, e.g. `https://your-domain.example/api/auth/callback` |
| `ADMIN_USER_ID_1` / `ADMIN_USER_ID_2` | The only Discord accounts allowed to sign in |
| `ADMIN_GUILD_ID` | Optional: pin the dashboard to one guild |
| `DASHBOARD_SESSION_SECRET` | Long random secret used to encrypt session cookies; generate with `openssl rand -hex 32` |
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
5. Deploy only after the file work is complete, then test OAuth login with each authorized account and verify protected routes redirect to `/login` when signed out.

## Remaining work before calling the whole product complete

- Implement and secure the bot bridge described in `BRIDGE.md` on the bot host.
- Verify every bridge read/write against real per-guild storage and bot permissions.
- Add real channel/role lookup endpoints before replacing manual-ID fields with selectors.
- Implement secure server-side webhook configuration storage, delivery retries, and redacted logs before enabling webhook delivery.
- Move advanced anti-raid drafts from browser-only storage into validated bridge-backed persistence and enforcement.
- Review and remediate outstanding npm audit findings without forcing breaking dependency upgrades.
- After the implementation work, run CI/build and end-to-end tests against a real bot bridge.

Do not report live integration as complete merely because the Next.js application builds or a Vercel deployment succeeds.