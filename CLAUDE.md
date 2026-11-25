# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm start                 # expo start; npm run android / npm run ios for a device or emulator
npm run web                # expo start --web
npm run build:web          # expo export -p web
npm test                  # Jest (ts-jest, node env)
npx tsc --noEmit          # typecheck
```

Run a single test file with `npx jest __tests__/trip-utils.test.ts` (or any path under `__tests__/`). There is no lint script.

CI (`.github/workflows/ci.yml`, Node 22) runs `npm ci`, `npm test -- --ci` (required) and `tsc --noEmit` (advisory via `continue-on-error`, until the last known error, `app/_layout.tsx` `<StatusBar>` props, is fixed).

## Environment Variables

Create a `.env.local` file at the root (see `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_MAPBOX_TOKEN=<your-mapbox-public-token>   # static map snapshots, see trip/[id].tsx
```

Only public values belong in `EXPO_PUBLIC_*` variables (they ship inside the app). Never put the service-role key or AWS keys there; Edge Functions read their own secrets from Supabase.

### Local Supabase (dev DB, separate from prod)

`.env.local` points at a **local Supabase stack** (Docker, via `npx supabase start`) by default — completely isolated from production, so migrations/seed data/testing never touch real user data. Prod credentials are backed up in `.env.production.local` (gitignored, only auto-loaded by Expo for production builds).

```bash
npx supabase start   # boots local stack (Docker must be running); prints local URL/anon key
npx supabase db reset # re-applies all migrations + supabase/seed.sql from scratch
npx supabase stop     # shuts the local stack down
```

`supabase/config.toml` is **tracked in Git** (not gitignored) specifically so every machine gets the same local ports — it overrides the default CLI ports to API/Kong `55321`, DB `55322`, Studio `55323`, Inbucket `55324` instead of the standard `54321-54324`. `npx supabase start` prints the actual URLs, but don't assume the standard `5432x` defaults when constructing a URL by hand (e.g. in a migration or script) — a hardcoded `127.0.0.1:54321` in a migration once broke image loading because it silently pointed at a port nothing was listening on. Local Studio UI: http://127.0.0.1:55323. Don't re-add `config.toml` to `.gitignore`; it holds no secrets (every sensitive field uses `env(VAR_NAME)` substitution). Local test accounts and their seed configuration are kept outside Git. On a physical device via Expo Go, `127.0.0.1` in `.env.local` won't reach the host machine — swap it for the machine's LAN IP.

To point the app at production temporarily, copy `.env.production.local`'s values into `.env.local` (or swap the files) and restart the dev server.

## Architecture

**Stack:** Expo (SDK 58) + React Native 0.88 + React 19 + TypeScript (strict) + expo-router (file-based routing) + Supabase (auth/DB/Edge Functions) + Zustand (client state). Styling is almost entirely `StyleSheet`; NativeWind is configured but only one file uses `className`. `app.json` declares `ios`/`android`/`web`, and `react-dom`/`react-native-web` are installed, so `npm run web` works.

### Routing (`app/`)

- `(auth)/` — `splash`, `login`, `register`, `verify-email`, `age-select`, `onboarding-style`.
- `(app)/` — main tabs: `index` (Home), `explore` (community feed), `workspace`, `profile/` (index, edit, trips, posts, checkin, missions, leaderboard, friends, friends-search).
- Other screens: `create-trip`, `search`, `trip/[id]`, `trip/add-location`, `location/[id]`, `post/[id]`, `post/create`, `experience/[id]`, `user/[id]`, `local` (local-culture discovery), `checkin`, `missions`, `leaderboard`, `weather/index`.
- `index.tsx` redirects to `/(auth)/login`; the root `_layout.tsx` auth guard then sends signed-in users to `/(app)`.

### Feature areas (`src/`)

Beyond core location/trip browsing, several self-contained subsystems live under `src/hooks/`, `src/lib/`, `src/components/`, each backed by its own migrations:

- **Check-in & streaks** — `useCheckin`, `src/lib/date-utils.ts` (Vietnam-timezone day boundaries), `src/components/checkin/MonthlyCheckinCalendar.tsx`. Daily check-in streaks with a "shield" that protects a missed day; local AsyncStorage cache hydrates the UI before the server round-trip. Tables: `checkin_streak`, `checkin_logs`.
- **Missions** — `useMissions`, RPC `report_mission_progress`, claiming converts progress into AI credits.
- **Leaderboard** — `useLeaderboard('posts' | 'checkins')`, reading `leaderboard_posts` / `leaderboard_checkins`.
- **Offline trip map** — `src/lib/offline-map.ts`, `offline-map-storage.ts`, `trip-map-html.ts`, `src/components/trip/TripOfflineMap.tsx` (+ `.web.tsx` variant). Snapshots the route as a PNG while online, stored in app document storage, keyed per user/trip/day. See `docs/OFFLINE_MAP.md` for the full save/invalidate contract and manual QA steps; `scripts/verify-offline-map.cjs` drives a Playwright check.
- **Weather-adaptive scheduling** — `src/lib/weather-adaptation/` (client) mirrors `supabase/functions/_shared/weather-adaptation/` (edge), both consumed by the `weather-advice` Edge Function and `useTripWeatherAdvice`/`WeatherAdviceCard`. Assesses per-timeslot weather risk and suggests transport changes.
- **Local experience discovery** — `app/local.tsx`, filters by theme or "vibe", backed by the `local_experiences` table.

### Code layout

- `src/hooks/` — Supabase queries (`useLocations`, `useUpcomingTrip`, `useTodaySchedule`, `useFollow`/`useFollowLists`, ...) plus the feature hooks above.
- `src/lib/` — `supabase.ts`, `i18n.ts` (vi/en strings, `useT()`), `trip-utils.ts` (pure helpers), `location-access.ts` (freemium-aware reads — see below), plus the feature libs above. Most pure-logic modules here have matching tests in `__tests__/`.
- `src/components/home/`, `src/components/ui/`, `src/components/trip/`, `src/components/checkin/`, `src/store/langStore.ts`, `src/theme/`, `src/types/`.
- Legacy code at the repo root: `lib/supabase.ts`, `store/authStore.ts` (plus `searchFilters.ts`, `tripPick.ts`), `hooks/useMascot.ts`, `components/Mascot/`. There are **two Supabase clients** (`lib/supabase.ts` and `src/lib/supabase.ts`); most code imports the one in `src/`.
- The `@/*` alias maps to the repo root, so use `@/src/...` for files under `src/`.

### Backend (`supabase/`)

- `migrations/` — 70+ files; schema, RLS, and seed data. Several files share a timestamp, so push order depends on filename. `locations` access is governed by RLS; the current rules are in `20261021000001_enforce_locations_freemium.sql` (it drops the old open `public_read_locations` policy from `20260627000002`). Read it before touching location access.
- `functions/` — `plan-trip` (AWS Bedrock, JWT check, AI credits), `get-distances` (Google Routes), `generate-location-hint` / `batch-generate-hints`, `weather-advice` (shares code with `src/lib/weather-adaptation/` via `_shared/weather-adaptation/`).
- Freemium model (`profiles.plan` = `'free'` | `'pro'`), enforced server-side: pro users read `locations` directly; free users get only the card fields in the `locations_preview` view (no address/coordinates/phone/hours), and `search_locations` masks those columns for them. Everyone can read the full row of locations in their own trips. Client code must read through `readLocations`/`countLocations` in `src/lib/location-access.ts` rather than querying `locations` directly. There is no purchase flow yet: `plan` is only changed by hand in the database.

### Team conventions

Avoid editing boot/startup files (`app/_layout.tsx`, root `index.tsx`, `babel.config.js`, `tailwind.config.js`, `app.json`) unless explicitly asked; they are the most conflict-prone files.
