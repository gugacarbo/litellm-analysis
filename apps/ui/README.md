# ui

TanStack Start app for the `lite-llm-analytics` monorepo.

## Workspace Commands

From the repo root:

```bash
pnpm run dev:ui
pnpm run build:ui
pnpm run test:ui
pnpm run lint:ui
pnpm run typecheck:ui
```

## Local Commands

From `apps/ui`:

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm lint
pnpm format
pnpm typecheck
pnpm knip
```

## Routing

Routes live in `src/routes/`. Add new files there and regenerate the route tree with:

```bash
pnpm generate-routes
```

## Notes

- This app uses TanStack Start with React and Vite.
- Keep browser-only code in this package and share logic through workspace packages when needed.
