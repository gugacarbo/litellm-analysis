# Web App Refactor: Hybrid Feature Structure

## Status
- **Draft**: 2026-05-18
- **Author**: gpt-5.5
- **Stage**: Pending user approval

## Overview

Refatorar a estrutura de pastas do web app (`apps/web/src/`) para melhorar manutenibilidade, com separação clara de responsabilidades e código auto-contido por feature.

**Problema atual**: Estrutura inconsistente com agrupamento misto, dificuldade em localizar código relacionado, imports imprevisíveis.

**Solução proposta**: Estrutura Hybrid com features auto-contidas e diretório `shared/` para código reutilizável.

---

## Current State Analysis

### Problems Identified

| # | Problema | Evidência |
|---|----------|-----------|
| 1 | Estrutura inconsistente | `dashboard/` tem subdir com types/utils, `logs.tsx` é arquivo plano |
| 2 | Nomenclatura confusa | `agent-config-editor.tsx` vs `agent-config/` vs `agent-routing/` |
| 3 | Hooks misturados | `use-dashboard-data/` vs `use-errors.ts` (flat) |
| 4 | Módulos dispersos | `agent-config-editor` em components, `agent-routing` em ambos |
| 5 | Imports não previsíveis | Páginas importam de components com caminhos relativos confusos |
| 6 | Sem agrupamento claro | Tudo no root, sem separação por feature |

### Current Directory Structure

```
src/
├── components/          # shadcn + domain modules mixed
│   ├── ui/             # page-layout
│   ├── dashboard/      # dashboard-specific
│   ├── agent-config-editor/
│   ├── agent-routing/
│   └── ...
├── pages/             # JSX + subdirs mixed
│   ├── dashboard.tsx  # flat
│   ├── dashboard/     # dashboard-specific
│   ├── logs.tsx       # flat
│   ├── logs/          # logs-specific
│   └── ...
├── hooks/             # flat + subdirs mixed
│   ├── use-dashboard-data.ts      # flat
│   ├── use-dashboard-data/       # subdir
│   ├── use-errors.ts              # flat
│   └── ...
├── lib/               # utilities
├── types/             # shared types
└── contexts/
```

---

## Proposed Structure

### Overview

```
src/
├── shared/                    # Código compartilhado entre features
│   ├── components/            # Componentes reutilizáveis
│   │   ├── ui/               # shadcn primitives + page-layout
│   │   ├── layout/            # sidebar, header
│   │   └── charts/           # chart wrappers (se houver)
│   ├── hooks/                 # Hooks reutilizáveis
│   │   ├── use-api.ts
│   │   ├── use-filter-context.ts
│   │   └── use-mobile.ts
│   └── lib/                   # Utils, api-client, formatadores
│       ├── api-client.ts
│       ├── query-client.ts
│       ├── format.ts
│       └── utils.ts
├── features/                  # Features auto-contidas
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── models/
│   ├── agents/
│   ├── logs/
│   ├── monitor/
│   └── prompts/
├── pages/                    # Entry points + roteamento
│   ├── index.ts              # Re-exports de todas as pages
│   └── App.tsx               # Router config
├── contexts/                 # Contextos globais
└── main.tsx
```

### Feature Structure Template

Cada feature segue o padrão:

```
features/<feature-name>/
├── components/              # Componentes usados SOMENTE nesta feature
│   ├── <feature>-card.tsx
│   ├── <feature>-table.tsx
│   └── <feature>-dialog.tsx
├── hooks/                   # Hooks específicos da feature
│   ├── use-<feature>-data.ts
│   └── use-<feature>-actions.ts
├── types/                   # Tipos específicos da feature
│   └── <feature>-types.ts
├── utils/                   # Utilitários específicos da feature
│   └── <feature>-utils.ts
└── index.ts                 # Exporta a página principal
```

### Shared Structure

```
shared/
├── components/
│   ├── ui/                  # shadcn + componentes genéricos
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── page-layout.tsx
│   │   └── ...
│   ├── layout/
│   │   └── sidebar.tsx
│   └── charts/             # Apenas wrappers genéricos se necessário
├── hooks/
│   ├── use-api.ts
│   ├── use-mobile.ts
│   └── use-local-storage.ts
└── lib/
    ├── api-client.ts
    ├── query-client.ts
    ├── query-keys.ts
    └── format.ts
```

---

## Migration Plan

### Phase 1: Create New Structure

1. Criar diretórios `shared/` e `features/`
2. Mover `components/ui/` → `shared/components/ui/`
3. Mover `components/layout/` → `shared/components/layout/`
4. Mover `lib/` → `shared/lib/`
5. Mover `contexts/` → `shared/contexts/` (exceto filter-context que pode ser global)
6. Mover hooks reutilizáveis para `shared/hooks/`

### Phase 2: Migrate Features (um por vez)

Para cada feature (dashboard, models, agents, logs, monitor, prompts):

1. Criar `features/<name>/`
2. Mover types de `pages/<name>/` → `features/<name>/types/`
3. Mover utils de `pages/<name>/` → `features/<name>/utils/`
4. Mover hooks de `hooks/` → `features/<name>/hooks/`
5. Mover components de `components/<name>/` → `features/<name>/components/`
6. Criar `features/<name>/index.ts` exportando a página
7. Atualizar imports em `App.tsx`

### Phase 3: Clean Up

1. Remover diretórios antigos (`components/`, `pages/`, `hooks/`, `types/`)
2. Atualizar path aliases em `tsconfig.json` e `vite.config.ts`
3. Atualizar imports em testes

---

## Naming Conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Feature directory | kebab-case | `agent-routing/` |
| Page file | `<feature>-page.tsx` | `dashboard-page.tsx` |
| Component file | PascalCase | `DashboardOverviewCards.tsx` |
| Hook file | `use-<feature>-<purpose>.ts` | `use-dashboard-data.ts` |
| Type file | `<feature>-types.ts` | `dashboard-types.ts` |
| Utils file | `<feature>-utils.ts` | `dashboard-utils.ts` |

---

## Import Rules

1. **Feature → Feature**: Evitar, preferir `shared/`
2. **Feature → shared**: Permitido e encouraged
3. **Feature → global**: Apenas via `shared/`
4. **No circular dependencies**

```
// ✅ Bom: feature importa de shared
import { PageLayout } from "@/shared/components/ui";
import { useApi } from "@/shared/hooks";

// ✅ Bom: page importa de feature
import { DashboardPage } from "@/features/dashboard";

// ❌ Ruim: feature importando de feature
import { Something } from "@/features/models"; // evitar
```

---

## Rollback Plan

Se necessário reverter:

1. Manter cópias dos arquivos originais em `.backup/` temporariamente
2. Commits atômicos por feature migrada
3. Reverter commit específico por feature

---

## Success Criteria

- [ ] Todos os arquivos migrated para nova estrutura
- [ ] Nenhum import quebrado
- [ ] Tests passing
- [ ] Build succeeds
- [ ] Dev server starts normally
- [ ] Arquitetura consistente entre todas as features
- [ ] Imports previsíveis e documentados

---

## Notes

- **Nomenclatura**: Padronizar `*-page.tsx` para páginas (não `*.tsx` genérico)
- **Barrel exports**: `index.ts` por feature, mas SEM `index.ts` em subdirectories
- **Path aliases**: Adicionar `@/features/` e `@/shared/` ao tsconfig
- **Contexto global**: `FilterProvider` permanece em contexts/ root (usado em App.tsx)

---

## Open Questions

- [ ] Devemos migrar `errors/` para `features/logs/` ou manter separado?
- [ ] `prompt-evals` deve ser `prompts` ou manter nome atual?
- [ ] Components compartilhados entre features vão para `shared/` ou devem ser Feature-based?
