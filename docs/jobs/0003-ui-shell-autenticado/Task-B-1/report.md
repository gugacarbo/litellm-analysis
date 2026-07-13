# Task-B-1 implementation report

## Status

Ready for review.

## TDD evidence

### RED

Command:

```bash
pnpm --dir apps/ui exec vitest run src/components/app-shell/app-sidebar.test.tsx src/components/app-shell/theme-control.test.tsx
```

Result: exit 1, as expected. Both suites failed during import resolution because
`./app-shell` and `./theme-control` did not yet exist.

### GREEN

Command:

```bash
pnpm --dir apps/ui exec vitest run src/components/app-shell/app-sidebar.test.tsx src/components/app-shell/theme-control.test.tsx
```

Result: exit 0; 2 test files and 4 tests passed. The tests cover the sole
Dashboard link and active state, desktop persistence callback, closed mobile
drawer, Escape close with restored trigger focus, non-persistence of mobile
drawer state, the two-theme limit, and recoverable theme-save failure.

Additional focused verification:

```bash
pnpm --dir apps/ui exec biome check src/components/app-shell/app-shell.tsx src/components/app-shell/app-sidebar.tsx src/components/app-shell/navigation.ts src/components/app-shell/theme-control.tsx src/components/app-shell/app-sidebar.test.tsx src/components/app-shell/theme-control.test.tsx
pnpm --dir apps/ui typecheck
git diff --check
```

Result: all exit 0.

## Files changed

- `apps/ui/src/components/app-shell/navigation.ts`
- `apps/ui/src/components/app-shell/theme-control.tsx`
- `apps/ui/src/components/app-shell/app-sidebar.tsx`
- `apps/ui/src/components/app-shell/app-shell.tsx`
- `apps/ui/src/components/app-shell/app-sidebar.test.tsx`
- `apps/ui/src/components/app-shell/theme-control.test.tsx`

## Accessibility behavior

- The navigation is a named `nav`; its only link is Dashboard to `/`, and the
  active route receives `aria-current="page"`.
- The mobile opener exposes its expanded state and dialog relationship. The
  controlled Base UI Drawer is modal, closes on Escape, and uses the library's
  focus handling with the opener as its final-focus target. No manual focus
  trap is implemented.
- The explicit theme choices live in a labelled `fieldset`, expose pressed
  state, and surface a recoverable save error through `role="alert"`.

## Callback contracts

- `onSidebarChange(next: "expanded" | "collapsed")` is invoked only by the
  desktop collapse/expand control. It is intentionally not called by opening,
  closing, dismissing, or navigating from the mobile drawer.
- `onThemeChange(next: "light" | "dark")` is the only theme-write boundary.
  A rejected callback leaves the controlled theme unchanged and shows a retry
  message.
- The shell receives `pathname`, preferences, and callbacks as typed props. It
  imports no server function, route session code, cookie API, or persistence
  mechanism.

## Scope check

The navigation configuration contains exactly Dashboard to `/`. No future or
legacy links, `apps/web` URLs, localStorage use, route integration, session
access, or persisted mobile state was added. Task-B-2 and unrelated dirty
worktree files were not edited.

## Concerns

No blocking concerns. Visual validation in the integrated protected route is
intentionally deferred to the route-integration task; this task verifies the
component contracts in jsdom.
