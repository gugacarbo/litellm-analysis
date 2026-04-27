# packages/alias-router/src/

## OVERVIEW
Model alias resolution for LiteLLM routing. Generates, validates, and resolves alias mappings between agent names and model identifiers.

## STRUCTURE

```
alias-router/src/
├── alias/
│   ├── cleanup.ts      # getExistingAliasesForAgent, replaceAliasesForAgent
│   ├── generate.ts     # generateLitellmAliases
│   └── resolve.ts      # resolveConfiguredModels, resolveModelValue, isLogicalModelForKey
├── constants/
│   └── model-names.ts  # AGENT_KEYS, CATEGORY_KEYS, MODEL_NAMES
├── sort/
│   └── index.ts        # sortAliasesByDefinitionOrder
├── utils/
│   ├── regex.ts        # escapeRegExp, generateAliasCleanupPattern
│   └── strip-prefix.ts # stripLitellmPrefix
└── index.ts            # Barrel: 18 named exports
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add alias generation | `alias/generate.ts` | Returns alias mapping object |
| Add model resolution | `alias/resolve.ts` | Maps agent names → model identifiers |
| Add cleanup logic | `alias/cleanup.ts` | Find/replace aliases for agent |
| Add constant | `constants/model-names.ts` | AGENT_KEYS, CATEGORY_KEYS, MODEL_NAMES |
| Add sort order | `sort/index.ts` | Definition-order sorting |
| Add utility | `utils/` | Regex or string helpers |

## CONVENTIONS

- Pure functions only — no side effects, no I/O
- No external dependencies beyond workspace packages
- Exports from barrel (`index.ts`) only — no direct subpath imports
- Test colocated at `__tests__/` (package root, not `src/`)

## ANTI-PATTERNS

- Don't add I/O or file operations — this package is pure logic
- Don't import from `@lite-llm/analytics` — would create circular dependency
- Don't hardcode model names — use constants from `model-names.ts`
