# APPS KNOWLEDGE BASE

## OVERVIEW

`apps/ui` is the only active deployable application. It is a TanStack Start
application that owns the product UI and its server-function boundary.

The former Vite web client and Express runtime are archived under `.old/` and
are intentionally excluded from workspace tooling.

## STRUCTURE

```
apps/
└── ui/                 # TanStack Start application
    └── src/            # File-based routes, server functions, components, and styles
```

## WHERE TO LOOK

| Task                     | Location                          | Notes                                    |
| ------------------------ | --------------------------------- | ---------------------------------------- |
| Add a UI route           | `apps/ui/src/routes/`             | TanStack Start file-based routes         |
| Add a server function    | `apps/ui/src/features/**/server/` | Keep the data boundary server-side       |
| Add a shared primitive   | `apps/ui/src/shared/components/`  | Reuse existing narrow UI primitives      |
| Change app configuration | `apps/ui/package.json`            | Vite/TanStack Start scripts and settings |

## CONVENTIONS

- Keep browser components free of direct database and credential access.
- Use server functions or `apps/ui/src/routes/api/` for server-side work.
- Keep feature-specific state and components colocated under their feature.
- Do not add new workspace applications without updating the root workspace and tooling configuration.
