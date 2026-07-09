# TanStack Start UI App

This app lives in `apps/ui` and uses TanStack Start with React and Vite.

## Setup

- Keep route files under `src/routes/`.
- Use `pnpm generate-routes` after route tree changes when needed.
- Prefer workspace-safe imports and avoid pulling Node-only code into browser components.

## Runtime

- App entry is `vite.config.ts` plus the TanStack Start route tree.
- This package is intended to run inside the monorepo with `pnpm`.

## Scripts contract

- Required scripts here are `dev`, `build`, `preview`, `test`, `lint`, `format`, `typecheck`, and `knip`.
- Keep `dev` on port `3000` unless the monorepo needs a coordinated change.
