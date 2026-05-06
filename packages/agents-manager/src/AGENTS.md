# packages/agents-manager/src/

## OVERVIEW
Agent/category config CRUD with file-based storage. Generates consumer configs for OpenCode, VS Code, and OpenAgent.

## STRUCTURE

```
agents-manager/src/
├── adapters/         # DB ↔ Config format conversion
├── api/              # CRUD functions + singleton manager
├── generators/       # Provider files (opencode.json, vscode-oaicopilot.json)
├── storage/          # File I/O abstraction
├── transformers/     # DB format → output format conversion
├── types/            # TypeScript interfaces
└── index.ts          # Barrel: 25+ exports
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add CRUD operation | `api/crud.ts` | Read/write `db.json` |
| Add consumer config | `generators/` | Transformers in `transformers/` |
| Change file paths | `types/index.ts` → `DEFAULT_FILE_PATHS` | `data/db.json`, `data/*.json` |
| Add adapter | `adapters/` | Convert between DB and config formats |

## KEY EXPORTS

- `createAgentsManager()` — singleton with file paths
- `writeProvidersFile()` — generates `data/opencode.json`
- `writeVscodeModelsFile()` — generates `data/vscode-oaicopilot.json`
- `syncOutputConfigFile()` — syncs `db.json` → `oh-my-openagent.json`

## DATA FLOW

1. `db.json` is source of truth (internal format)
2. Transformers convert DB → output config
3. Generators write provider/VS Code files

## CONVENTIONS

- Implementation files are `.ts`; imports use `.js` extensions (verbatimModuleSyntax + ESM)
- Dynamic imports for `config-file.js` to avoid circular deps
- File paths resolved relative to project root

## ANTI-PATTERNS

- Don't rename source files to `.js` — all source files are `.ts`. Using `.js` extensions in `import` statements is correct and required (ESM/verbatimModuleSyntax convention).
