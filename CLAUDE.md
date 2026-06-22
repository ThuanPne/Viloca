# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web

# Install dependencies
npm install
```

No lint or test scripts are configured yet.

## Environment Variables

Create a `.env.local` file at the root with:

```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are read in [lib/supabase.ts](lib/supabase.ts) via `process.env.EXPO_PUBLIC_*`.

## Architecture

**Stack:** Expo (SDK 56) + React Native 0.85 + TypeScript (strict) + expo-router (file-based routing) + NativeWind v4 (Tailwind for RN) + Supabase (auth/DB) + Zustand (client state).

### Routing (`app/`)

Expo Router file-based routing with two route groups:

- `(auth)/` — unauthenticated screens: `welcome`, `login`, `register`. Uses a Stack navigator.
- `(app)/` — authenticated screens: `profile/index`, `profile/edit`. Uses a Tabs navigator.
- `index.tsx` — root redirect, currently sends all traffic to `/(auth)/welcome`.

The root `_layout.tsx` imports `global.css` (Tailwind entry point) and wraps everything in a headerless Stack.

### State Management (`store/`)

Single Zustand store: `authStore.ts` holds `user: User | null` (Supabase `User` type) with a `setUser` action. No persistence layer yet.

### Backend (`lib/`)

`supabase.ts` exports a single Supabase client instance. All backend calls go through this client.

### Styling

NativeWind v4 — use `className` props on React Native primitives. Tailwind scans `app/**` and `components/**`. The Babel plugin (`nativewind/babel`) and `jsxImportSource: 'nativewind'` in `babel.config.js` enable this.
