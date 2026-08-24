# Evently Admin

Internal administration console for the Evently platform. React + TypeScript + Vite.

Separate application and separate repository from the three existing Evently
projects (`Evently_Mobile_Frontend`, `evently-BackEnd`, `evently-FrontEnd`). It
shares none of their code.

## Status

Scaffold only. No admin functionality is implemented — no auth, dashboard, user
or organizer management, bookings, payments, reports, settings or permissions.
Those are added when the requirements are defined.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in VITE_API_BASE_URL
npm run dev
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run typecheck` | Types only, no emit |
| `npm run lint` | ESLint |
| `npm run preview` | Serve the production build locally |

## Configuration

All configuration comes from the environment. `.env.example` is the tracked
template; `.env` is gitignored and never committed.

`VITE_API_BASE_URL` has no default and no placeholder value on purpose — a
plausible-looking fake URL is worse than an empty one, because it fails at
runtime instead of at setup.

## Structure

Intentionally minimal. Folders are added when something needs them rather than
created empty up front, so the layout below is where things will go — not a set
of directories that already exists:

```
src/
  app/         providers, router composition
  routes/      route definitions
  layouts/     page shells (nav, header)
  pages/       one folder per screen
  components/  shared presentational components
  services/    API layer
  types/       shared wire and domain types
  utils/       shared helpers
```

## Tooling note

The current Vite `react-ts` template ships **oxlint**. This project uses
**ESLint** instead, to stay on the same toolchain as the rest of Evently.
