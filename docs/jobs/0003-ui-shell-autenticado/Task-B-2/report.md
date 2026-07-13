# Task-B-2 — Better Auth client and account menu

## Status

Ready for review. The standalone client and account-menu primitive are complete;
route wiring remains explicitly owned by Task-C-1.

## RED / GREEN evidence

### RED

```text
$ pnpm --dir apps/ui exec vitest run src/components/app-shell/account-menu.test.tsx
FAIL Failed to resolve import "./account-menu" from "src/components/app-shell/account-menu.test.tsx".
Test Files  1 failed (1)
Tests  no tests
```

The focused test was written first and correctly failed because the component
and client did not exist.

### GREEN

```text
$ pnpm --dir apps/ui exec vitest run src/components/app-shell/account-menu.test.tsx
Test Files  1 passed (1)
Tests  3 passed (3)
```

The three focused behaviors cover public account fields, successful official
sign-out followed by navigation to `/login`, and a failed sign-out that keeps
the menu visible with an accessible retryable error.

```text
$ pnpm --dir apps/ui exec biome check src/lib/auth-client.ts src/components/app-shell/account-menu.tsx src/components/app-shell/account-menu.test.tsx
Checked 3 files. No fixes applied.
```

`git diff --check --` for the three implementation files also exited 0.

## Files changed

- `apps/ui/src/lib/auth-client.ts` — browser-safe `createAuthClient()` export.
- `apps/ui/src/components/app-shell/account-menu.tsx` — public-data-only menu
  and recoverable sign-out flow.
- `apps/ui/src/components/app-shell/account-menu.test.tsx` — focused TDD
  coverage. It mocks Better Auth as the service boundary; the JSDOM location
  primitive is stubbed only to observe native navigation, which JSDOM does not
  implement.

## Better Auth contract

`authClient` is created from `better-auth/react` with no secrets or server
imports. Better Auth 1.6.23 defaults this client to `/api/auth`; its official
`signOut()` action uses POST `/sign-out`, resolving to the existing
`/api/auth/sign-out` infrastructure endpoint. The component redirects with
`globalThis.location.assign("/login")` only when `result.error` is absent.
It displays a generic error when Better Auth reports an error or throws, so the
shell and supplied public data remain usable and no infrastructure detail is
shown to the user.

## Scope check

- Props are exactly `name`, `email`, and `role`; no session, token, cookie, or
  extra user data crosses into the component.
- No server function, database module, `apps/server` API, administrative API,
  or server-only module is imported.
- No Task-B-1 file or `super-plan.json` was edited.
- The menu contains no theme selector and does not perform route wiring.

## Concerns

The focused test and targeted Biome check pass. The package-wide
`pnpm --dir apps/ui typecheck` currently fails in concurrent Task-B-1 test
files (`app-sidebar.test.tsx` and `theme-control.test.tsx`) because this repo's
Vitest type setup does not provide their `toHaveAttribute`, `toBeInTheDocument`,
`toHaveFocus`, and `toHaveTextContent` matcher types. None of the errors name
Task-B-2 files.
