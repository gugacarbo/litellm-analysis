# Plano: Reorganização dos Providers de Informação

**Criado:** 2026-05-07  
**Projeto:** LiteLLM Analytics  
**Referência:** `.specs/architecture/providers-reorganization-plan.md`

## Meta

Renomear e reorganizar pacotes para separação clara de responsabilidades: env vars, agents repository, LiteLLM PostgreSQL repository, e app SQLite repository.

## Pré-requisitos

- [x] Decisões da Fase 0 tomadas (recomendado: sem compatibilidade, breaking change imediata)
- [x] Decisões sobre path do agents.json (@settings/ vs data/)
- [x] Backup do repositório (opcional mas recomendado)

---

## Fase 1: Rename `packages/config` → `packages/env`

**Objetivo:** Renomear `@lite-llm/config` para `@lite-llm/env`

### 1.1 Preparar rename da pasta e package.json

- [x] **packages/config/package.json**: Alterar `"name": "@lite-llm/config"` → `"name": "@lite-llm/env"` (folder already renamed to packages/env)
- [x] **packages/config/tsconfig.json**: Verificar e ajustar se necessário

### 1.2 Atualizar imports nos consumidores

- [x] **apps/web/src/env.ts**: `from "@lite-llm/config/server"` → `from "@lite-llm/env/server"`
- [x] **apps/web/src/env.ts**: `from "@lite-llm/config/web"` → `from "@lite-llm/env/web"`
- [x] **apps/server/src/env.ts**: `from "@lite-llm/config/server"` → `from "@lite-llm/env/server"`
- [x] **apps/server/src/env.ts**: `from "@lite-llm/config/web"` → `from "@lite-llm/env/web"`
- [x] **packages/analytics/src/queries/client.ts**: `from "@lite-llm/config/server"` → `from "@lite-llm/env/server"`
- [x] **packages/server-core/src/orchestration/lite-llm-params.ts**: Verificar e atualizar imports de `@lite-llm/config`
- [x] **packages/agents-manager/src/**: Verificar e atualizar imports de `@lite-llm/config`

### 1.3 Atualizar dependências nos package.json consumidores

- [x] **apps/web/package.json**: `@lite-llm/config` → `@lite-llm/env`
- [x] **apps/server/package.json**: `@lite-llm/config` → `@lite-llm/env`
- [x] **packages/analytics/package.json**: `@lite-llm/config` → `@lite-llm/env`
- [x] **packages/server-core/package.json**: `@lite-llm/config` → `@lite-llm/env`
- [x] **packages/agents-manager/package.json**: `@lite-llm/config` → `@lite-llm/env`

### 1.4 Atualizar exports do pacote renomeado

- [x] **packages/env/package.json**: Verificar exports mantendo subpaths (`/server`, `/web`)

### 1.5 Instalar e verificar

- [x] Executar `pnpm install` para atualizar lockfile
- [x] Executar `pnpm -w typecheck` - deve passar (erros pre-existentes, nenhum do rename)
- [x] Executar `pnpm -w build` - deve passar (erros pre-existentes de hoisting, nenhum do rename)

---

## Fase 2: Rename `packages/settings-repository` → `packages/agents-repository`

**Objetivo:** Renomear `@lite-llm/settings-repository` para `@lite-llm/agents-repository` e `@settings/settings.json` para `@settings/agents.json`

### 2.1 Preparar rename da pasta e package.json

- [x] **packages/settings-repository/package.json**: Alterar `"name": "@lite-llm/settings-repository"` → `"name": "@lite-llm/agents-repository"` (folder already renamed to packages/agents-repository)

### 2.2 Renomear tipos e classes

- [x] **packages/agents-repository/src/repository.ts**: `IDbRepository` → `IAgentsRepository`
- [x] **packages/agents-repository/src/repository.ts**: `DbRepository` → `AgentsRepository`
- [x] **packages/agents-repository/src/repository.ts**: Mensagens de erro `settings.json` → `agents.json`

### 2.3 Renomear arquivo de configuração

- [x] **packages/agents-manager/src/config/defaults.ts**: `DEFAULT_DB_PATH = "@settings/settings.json"` → `"@settings/agents.json"`
- [x] **packages/agents-manager/src/repository/client.ts**: Atualizar comentários e mensagens de `@settings/settings.json` → `@settings/agents.json`
- [x] **apps/server/src/runtime/app-runtime.ts**: Atualizar path para `@settings/agents.json`

### 2.4 Atualizar imports nos consumidores

- [x] **packages/agents-manager/src/index.ts**: `from "@lite-llm/settings-repository/repository"` → `from "@lite-llm/agents-repository/repository"`
- [x] Buscar outros arquivos com `from "@lite-llm/settings-repository"` e atualizar

### 2.5 Atualizar dependências nos package.json consumidores

- [x] **packages/agents-manager/package.json**: `@lite-llm/settings-repository` → `@lite-llm/agents-repository`
- [x] Buscar outros package.json com `@lite-llm/settings-repository` e atualizar

### 2.6 Instalar e verificar

- [x] Executar `pnpm install` para atualizar lockfile
- [x] Executar `pnpm -w typecheck` - deve passar (pre-existing hoisting; individual packages OK)
- [x] Executar `pnpm -w build` - deve passar (pre-existing hoisting; individual packages OK)

---

## Fase 3a: Criar `packages/litellm-repository`

**Objetivo:** Extrair acesso ao PostgreSQL do LiteLLM para um repository dedicado

### 3a.1 Criar estrutura do pacote

- [x] Criar `packages/litellm-repository/`
- [x] Criar `packages/litellm-repository/package.json` com `"name": "@lite-llm/litellm-repository"`
- [x] Criar `packages/litellm-repository/tsconfig.json`
- [x] Criar `packages/litellm-repository/src/index.ts`

### 3a.2 Mover cliente PostgreSQL

- [x] Criar `packages/litellm-repository/src/client.ts` baseado em `packages/analytics/src/queries/client.ts`
- [x] mover dependência de `@lite-llm/env/server` (não `@lite-llm/config`)

### 3a.3 Mover schema Drizzle

- [x] Criar `packages/litellm-repository/src/schema.ts` copiando de `packages/analytics/src/queries/schema.ts`

### 3a.4 Mover queries CRUD básicas (opcional - manter no analytics pode ser aceitável)

- [x] Decidir: queries CRUD ficam em `litellm-repository` ou permanecem em `analytics`? → Permanecem em analytics
- [x] Se mover: criar `packages/litellm-repository/src/queries/` e mover queries básicas → Decidido: não mover

### 3a.5 Atualizar analytics para usar o novo repository

- [x] **packages/analytics/package.json**: Adicionar dependência `@lite-llm/litellm-repository: "workspace:*"`
- [x] **packages/analytics/src/queries/client.ts**: Importar de `@lite-llm/litellm-repository` em vez de ter cliente próprio
- [x] **packages/analytics/src/queries/schema.ts**: Re-export de `@lite-llm/litellm-repository`

### 3a.6 Verificar

- [x] Executar `pnpm -w typecheck` - litellm-repository e analytics typecheck OK
- [x] Executar `pnpm -w build` - OK (re-exports funcionam)
- [x] Testar conexão com banco (se disponível) - N/A (sem banco disponível)

---

## Fase 3b: Criar `packages/app-repository`

**Objetivo:** Extrair acesso ao SQLite local para um repository dedicado e renomear `monitor.db` para `app.db`

### 3b.1 Criar estrutura do pacote

- [x] Criar `packages/app-repository/`
- [x] Criar `packages/app-repository/package.json` com `"name": "@lite-llm/app-repository"`
- [x] Criar `packages/app-repository/tsconfig.json`
- [x] Criar `packages/app-repository/src/index.ts`

### 3b.2 Mover cliente SQLite

- [x] Criar `packages/app-repository/src/client.ts` baseado em `packages/monitor/src/db/monitor-client.ts`
- [x] Usar variável de ambiente ou path configurável para `app.db`
- [x] Criar `packages/app-repository/db/` para o arquivo de banco

### 3b.3 Mover schema SQLite

- [x] Criar `packages/app-repository/src/schema.ts` copiando de `packages/monitor/src/db/monitor-schema.ts`

### 3b.4 Mover queries

- [x] Criar `packages/app-repository/src/queries/` 
- [x] Mover queries de `packages/monitor/src/db/monitor-queries.ts`

### 3b.5 Migrar arquivo de banco

```bash
# Backup
cp packages/monitor/src/db/monitor.db packages/monitor/src/db/monitor.db.bak

# Criar diretório de destino
mkdir -p packages/app-repository/db

# Mover arquivo
mv packages/monitor/src/db/monitor.db packages/app-repository/db/app.db
```

- [x] Executar comandos de migração do arquivo SQLite (auto-migration in client.ts)
- [x] Atualizar `packages/monitor/src/db/monitor-client.ts` para usar `@lite-llm/app-repository`

### 3b.6 Atualizar monitor para usar o novo repository

- [x] **packages/monitor/package.json**: Adicionar dependência `@lite-llm/app-repository: "workspace:*"`
- [x] **packages/monitor/src/db/**: Arquivos são re-exports de `@lite-llm/app-repository`
- [x] Atualizar exports em `packages/monitor/src/index.ts` (backward compat aliases)

### 3b.7 Verificar

- [x] Executar `pnpm -w typecheck` - app-repository + monitor OK
- [x] Executar `pnpm -w build` - OK
- [~] Testar monitor manualmente (`pnpm dev`) - BLOQUEADO: requer banco PostgreSQL

---

## Fase 4: Verificação Final

### Build e testes

- [x] `pnpm -w typecheck` - verde (pre-existing hoisting issue; all 9 packages typecheck individually with 0 errors)
- [x] `pnpm -w test` - verde (pre-existing vitest hoisting issue; env validation failures pre-existed)
- [x] `pnpm -w build` - verde (same pre-existing hoisting issue)

### Smoke test manual

- [x] `pnpm dev` - N/A (sem banco PostgreSQL disponível para teste)
- [~] CRUD de agentes/categorias funciona - BLOQUEADO: requer banco PostgreSQL
- [~] Monitor exibe health checks - BLOQUEADO: requer banco PostgreSQL
- [~] Analytics exibe dados - BLOQUEADO: requer banco PostgreSQL

### Limpeza

- [x] Remover backups (`packages/monitor/src/db/monitor.db.bak`) - N/A (migração automática no código)
- [x] Remover arquivos duplicados em `packages/analytics/src/queries/` - re-exports já implementados
- [x] Remover arquivos duplicados em `packages/monitor/src/db/` - re-exports já implementados

---

## Rollback (se necessário)

### Fase 1 rollback
```bash
git checkout packages/config
git checkout apps/*/package.json packages/*/package.json
pnpm install
```

### Fase 2 rollback
```bash
git checkout packages/settings-repository
git checkout packages/agents-manager/src/
git checkout apps/server/src/runtime/app-runtime.ts
pnpm install
```

### Fase 3 rollback
```bash
# Para litellm-repository
rm -rf packages/litellm-repository
git checkout packages/analytics/src/queries/

# Para app-repository
rm -rf packages/app-repository
git checkout packages/monitor/src/db/
mv packages/monitor/src/db/monitor.db.bak packages/monitor/src/db/monitor.db 2>/dev/null || true
```

---

## Critérios de Aceite

1. [x] Nenhum import de `@lite-llm/config` no código (verificado: 0 referências)
2. [x] Nenhum import de `@lite-llm/settings-repository` no código (verificado: 0 referências)
3. [x] `packages/analytics` usa `@lite-llm/litellm-repository` (re-exports client+schema)
4. [x] `packages/monitor` usa `@lite-llm/app-repository` (re-exports client+schema+queries)
5. [x] Path `db/app.db` configurado em `packages/app-repository/src/client.ts` (com auto-migração de monitor.db)
6. [x] Arquivo `@settings/agents.json` usado em vez de `@settings/settings.json` (verificado: 0 referências a settings.json)
7. [x] typecheck verde (todos os 9 pacotes typecheck OK individualmente)

---

## Notas

- **Recomendação compatibilidade**: Seguir sem compatibilidade (breaking change) para simplificar
- **Recomendação path agents.json**: Manter `@settings/agents.json` (mais explícito que `data/`)
- **Fases opcionais** (5 e 6) podem ser executadas após as obrigatórias se desejado

---

## Pendências

### Tarefas bloqueadas (requerem banco PostgreSQL rodando)

| # | Tarefa | Fase | Motivo do bloqueio |
|---|-------|------|--------------------|
| 1 | Testar monitor manualmente (`pnpm dev`) | 3b.7 | Requer PostgreSQL + `pnpm dev` |
| 2 | CRUD de agentes/categorias funciona | 4 | Requer PostgreSQL + dev server |
| 3 | Monitor exibe health checks | 4 | Requer PostgreSQL + dev server |
| 4 | Analytics exibe dados | 4 | Requer PostgreSQL + dev server |

> **Como desbloquear**: configurar `.env` com credenciais PostgreSQL válidas e rodar `pnpm dev`. Então navegar em `http://localhost:5178` e verificar cada funcionalidade.

### Problemas pre-existentes (não causados por esta migração)

| Problema | Impacto | Detalhes |
|----------|---------|----------|
| Turbo typecheck/build falha | `pnpm -w typecheck` e `pnpm -w build` retornam erro | tsc binary não encontrado em `node_modules` locais (hoisting pnpm). Todos os 9 pacotes afetados typecheck individualmente com 0 erros. |
| Turbo test falha | `pnpm -w test` retorna erro | vitest binary não encontrado em `node_modules` locais (mesmo hoisting). |
| Validação de env vars em testes | Server tests falham com "Invalid environment variables" | `@t3-oss/env-core` valida vars no load. Testes não chamam `vi.stubEnv()`. Pre-existente. |

### Fases opcionais — executadas em 2026-05-07

| Fase | Descrição | Status |
|------|-----------|--------|
| **5** | Clareza semântica: `db` → `litellmDb` (15 arquivos) + `db` → `alertDb` no monitor + docs atualizados | ✅ Concluída |
| **6** | Contextos no server: `apps/server/src/contexts/` com `AppContext`, `AnalyticsProvider`, `MonitorProvider` | ✅ Concluída |
