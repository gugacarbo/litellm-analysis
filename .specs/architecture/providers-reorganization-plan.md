# Reorganização dos Providers de Informação

## Objetivo
<!-- TAIL校正: 2026-05-07 - Adaptado ao estado real do codebase -->

Organizar as fontes de dados e configuração por responsabilidade clara, reduzir
ambiguidade de nomenclatura (`db` genérico), e preparar uma migração segura de
`packages/config` para `packages/env`.

## Estado Atual do Codebase (Análise: 2026-05-07)

### Pacotes Existentes

| Pacote | Nome npm | Status |
|--------|---------|--------|
| `packages/config` | `@lite-llm/env` | ✅ Existe - candidato a rename |
| `packages/settings-repository` | `@lite-llm/agents-repository` | ✅ Existe - candidato a rename |
| `packages/analytics` | `@lite-llm/analytics` | ✅ Existe - acesso direto ao PostgreSQL |
| `packages/monitor` | `@lite-llm/monitor` | ✅ Existe - acesso direto ao SQLite |
| `packages/agents-manager` | `@lite-llm/agents-manager` | ✅ Existe -wraps settings-repository |
| `packages/litellm-repository` | — | ❌ Não existe - candidato a criar |
| `packages/app-repository` | — | ❌ Não existe - candidato a criar |

### Arquivos e Caminhos

| Item | Status | Observação |
|------|--------|------------|
| `@settings/settings.json` | Dinâmico | Criado em runtime via `path.join(projectRoot, "@settings", "settings.json")` |
| `@settings/settings.json` | Default | Definido em `packages/agents-manager/src/config/defaults.ts` |
| `db/monitor.db` | ✅ Existe | Em `packages/monitor/src/db/monitor-client.ts` - caminho hardcoded |
| `data/db.json` | ❌ Não existe | Referenciado no plano mas não existe atualmente |
| `data/*.json` | ✅ Existe | `opencode.json`, `oh-my-openagent.json`, `vscode-oaicopilot.json` |

### Acoplamento Atual (Problemas Identificados)

1. **`packages/analytics`** importa `@lite-llm/env/server` diretamente em `queries/client.ts`
   - Deveria depender de `@lite-llm/env` (após rename)
2. **`packages/analytics`** tem cliente PostgreSQL próprio em `queries/client.ts`
   - Não usa repository abstrato
3. **`packages/monitor`** tem cliente SQLite próprio em `db/monitor-client.ts`
   - Caminho hardcoded: `../../db/monitor.db`
4. **`packages/agents-manager`**wraps `settings-repository` e expõe serviços

## Escopo Atual

Hoje existem **quatro fontes/provedores** (não três como mencionado no plano original):

1. `settings-repository` (renome planejado para `agents-repository`):
   leitura/escrita de `@settings/settings.json` (alvo: `@settings/agents.json`).
2. `monitor.db` (SQLite): monitoramento, alertas e health-check.
3. Banco principal do LiteLLM (PostgreSQL): gastos, erros, credenciais e roteamento.
4. `packages/config` (futuro `packages/env`): validação e carga de env vars.

## Mudanças Sugeridas

## 1) Renomear `packages/config` → `packages/env`

### Mudanças de estrutura

1. Renomear pasta:
   - `packages/config` -> `packages/env`
2. Renomear pacote:
   - `@lite-llm/env` -> `@lite-llm/env`

### Imports a atualizar (lista completa verificada)

1. `apps/web/src/env.ts`
2. `apps/server/src/env.ts`
3. `packages/analytics/src/queries/client.ts` ← **ADICIONADO** (não estava no plano)
4. `packages/server-core/src/orchestration/lite-llm-params.ts`
5. `package.json` de consumidores com dependência `@lite-llm/env`
6. lockfile (`pnpm-lock.yaml`) após `pnpm install`

### Impacto verificado nos package.json

| Consumidor | Dependência atual | Ação |
|------------|-------------------|------|
| `apps/web` | `@lite-llm/env` | Atualizar |
| `apps/server` | `@lite-llm/env` | Atualizar |
| `packages/analytics` | `@lite-llm/env` | Atualizar |
| `packages/server-core` | `@lite-llm/env` | Atualizar |
| `packages/agents-manager` | `@lite-llm/env` | Atualizar |

## 2) Organização por domínio (bounded contexts)

### Proposta de responsabilidades

1. `packages/env`
   - Somente env vars (`serverEnv`, `webEnv`, schemas e defaults).
2. `packages/agents-repository`
   - Somente persistência do `@settings/agents.json`
     (settings/agents/categories).
3. `packages/litellm-repository` (novo)
   - Somente acesso ao PostgreSQL do LiteLLM (client, schema, queries CRUD).
4. `packages/app-repository` (novo nome)
   - Renomear o sqlite `monitor.db` para `app.db`.
   - Somente acesso ao SQLite local `app.db` (client, schema, queries CRUD).
5. `packages/analytics`
   - Serviços e agregações analíticas usando `@lite-llm/litellm-repository`.
6. `packages/monitor`
   - Lógica de monitoramento/detectores usando `@lite-llm/app-repository`.
7. `packages/server-core`
   - Somente orquestração entre os pacotes acima.

### Decisões adicionais necessárias

1. Definir se `packages/agents-manager` será mantido como camada de serviço
   (sobre repositories) ou renomeado para `packages/agents-service`.
2. Definir se haverá janela de compatibilidade para imports legados
   (`@lite-llm/env` e `@lite-llm/agents-repository`) com re-export.
3. Confirmar diretório de configuração final:
   - manter `@settings/agents.json` (atual, padrão), ou
   - mover para `data/agents.json`.
   - **Recomendação**: manter `@settings/` por ser mais explícito

### Mapa de impacto completo

1. `package.json` + `exports` dos pacotes renomeados
   (`@lite-llm/env`, `@lite-llm/agents-repository`).
2. Todos os consumidores com `vi.mock(...)` e imports de subpath
   (`/server`, `/web`, `/repository`, `/queries`).
3. Defaults de bootstrap do server e agents manager:
   - `apps/server/src/runtime/app-runtime.ts`
   - `packages/agents-manager/src/config/defaults.ts`
   - `packages/agents-manager/src/repository/client.ts`
4. Documentação técnica:
   - `AGENTS.md` (atualizar estrutura de pacotes)
   - `.specs/architecture/*` (atualizar planos)
   - `packages/*/AGENTS.md` (atualizar referências)

### Regra prática

1. Pacotes de domínio **não** devem conhecer detalhes de outros storages.
2. `server-core` deve ser o único ponto de composição entre providers.

## 3) Padronização de nomenclatura

### Convenções recomendadas

1. Usar `*Repository` para abstrações de persistência.
2. Evitar `db` genérico em nomes de variáveis e serviços.
3. Preferir nomes explícitos:
   - `litellmDb` para PostgreSQL do LiteLLM
   - `appSqliteDb` para SQLite local do app
   - `agentsFile` ou `agentsPath` para `agents.json`
4. Para interfaces/classes principais:
   - `ILiteLLMRepository` / `LiteLLMRepository`
   - `IAppRepository` / `AppRepository`

### Evolução sugerida no `agents-repository`

1. `IDbRepository` -> `IAgentsRepository`
2. `DbRepository` -> `AgentsRepository`
3. Mensagens de validação:
   - de: `Invalid settings.json`
   - para: `Invalid agents.json` (ou nome/path real do arquivo)

> Observação: esses renames são recomendados para clareza, mas podem ser
> executados em fase separada para reduzir risco de quebra.

## 4) Organização opcional no app server

Criar contextos em `apps/server/src/contexts/`:

1. `contexts/env`
2. `contexts/agents`
3. `contexts/analytics`
4. `contexts/monitor`

Cada contexto expõe uma facade de provider, por exemplo:

1. `createEnvProvider()`
2. `createAgentsProvider()`
3. `createAnalyticsProvider()`
4. `createMonitorProvider()`

## Plano de Migração (ordem segura)

### Fase 0 — Congelar decisões de naming/compatibilidade

1. Decidir destino de `agents-manager` (manter vs renomear).
2. Decidir política de compatibilidade:
   - sem compatibilidade (breaking change imediata), ou
   - compatibilidade temporária com pacotes wrappers.
3. Decidir caminho definitivo do arquivo de configuração:
   `@settings/agents.json` ou `data/agents.json`.
4. **DECISÃO RECOMENDADA**: Seguir sem compatibilidade (breaking change imediata)
   - Menos código de migração
   - Limpeza mais rápida
   - Atualizar todos os consumidores de uma vez

### Fase 1 — Rename do pacote de env

1. Renomear pasta para `packages/env`.
2. Ajustar `name` no `package.json` para `@lite-llm/env`.
3. Atualizar imports `@lite-llm/env/*` -> `@lite-llm/env/*`.
4. Atualizar dependências nos `package.json` consumidores.
5. Rodar `pnpm install` para atualizar lockfile.
6. Atualizar `exports` do pacote para manter subpaths:
   `@lite-llm/env/server` e `@lite-llm/env/web`.
7. Verificar imports em `packages/analytics/src/queries/client.ts`
   (não estava no plano original!)

### Fase 2 — Migração de settings para agents

1. Renomear pacote:
   - `packages/settings-repository` -> `packages/agents-repository`
   - `@lite-llm/agents-repository` -> `@lite-llm/agents-repository`
2. Renomear contratos:
   - `IDbRepository` -> `IAgentsRepository`
   - `DbRepository` -> `AgentsRepository`
3. Renomear arquivo:
   - `@settings/settings.json` -> `@settings/agents.json`
4. Ajustar defaults/bootstrapping para novo nome de arquivo.
5. Atualizar mensagens de erro e validação para `agents.json`.
6. Atualizar dependências em `packages/agents-manager/src/index.ts`

### Fase 3 — Extração dos repositories de banco (NOVO - não detalhado antes)

Este é o **maior impacto** - separação de concerns entre acesso a dados e lógica de negócio.

#### 3a. Criar `packages/litellm-repository`

1. Criar estrutura:
   ```
   packages/litellm-repository/src/
   ├── client.ts      # Pool PostgreSQL, init, close
   ├── schema.ts      # Drizzle schema (mover de analytics)
   ├── queries/       # Queries CRUD básicas (mover de analytics)
   └── index.ts       # Exports
   ```
2. Dependências: `pg`, `drizzle-orm/node-postgres`, `@lite-llm/env`
3. Atualizar `packages/analytics` para importar de `@lite-llm/litellm-repository`
4. **ATENÇÃO**: Manter compatibilidade com exports atuais do analytics se possível

#### 3b. Criar `packages/app-repository`

1. Criar estrutura:
   ```
   packages/app-repository/src/
   ├── client.ts      # SQLite better-sqlite3, init
   ├── schema.ts      # Drizzle schema SQLite (mover de monitor)
   ├── queries/       # Queries CRUD (mover de monitor)
   └── index.ts       # Exports
   ```
2. Dependências: `better-sqlite3`, `drizzle-orm/better-sqlite3`
3. Renomear arquivo de banco:
   - De: `packages/monitor/src/db/monitor.db`
   - Para: `packages/app-repository/db/app.db`
4. Atualizar `packages/monitor` para importar de `@lite-llm/app-repository`

#### 3c. Migração de arquivo SQLite

```bash
# Backup antes de migrar
cp packages/monitor/src/db/monitor.db packages/monitor/src/db/monitor.db.bak

# Mover para novo local
mv packages/monitor/src/db/monitor.db packages/app-repository/db/app.db
```

### Fase 4 — Verificação técnica

1. `pnpm -w typecheck`
2. `pnpm -w test`
3. `pnpm -w build`
4. Smoke test manual:
   - subir app (`pnpm dev`)
   - validar CRUD de agentes/categorias
   - validar monitor + health-check + alerts
5. **Testes específicos a verificar**:
   - `apps/server/src/__tests__/agent-config-*.test.ts`
   - `apps/server/src/__tests__/agent-routing.test.ts`
   - `apps/server/src/__tests__/helpers/create-mock-data-source.ts`
   - `apps/web/src/lib/__tests__/locale.test.ts`

### Fase 5 — Clareza semântica (opcional, recomendada)

1. Aplicar renames de tipos/classes no `agents-repository`.
2. Atualizar nomes de variáveis/serviços com `db` ambíguo.
3. Ajustar mensagens de erro para refletir o arquivo real.
4. Limpar compatibilidade temporária (se adotada na Fase 0).

### Fase 6 — Contextos no server (opcional)

1. Extrair facades por contexto.
2. Delegar montagem final ao `server-core`.
3. Validar regressão com testes de integração do server.

## Critérios de Aceite

1. Nenhum import restante de `@lite-llm/env`.
2. Nenhum import restante de `@lite-llm/agents-repository`
   (ou wrapper marcado como deprecado e isolado).
3. `typecheck`, `test` e `build` verdes no workspace.
4. `packages/analytics` sem acesso direto a client/schema/queries de PostgreSQL.
5. `packages/monitor` sem acesso direto a client/schema/queries de SQLite.
6. Persistência local usando `db/app.db` (sem referências ativas a `db/monitor.db`).
7. Configuração de agentes usando `@settings/agents.json`
   (sem referências ativas a `@settings/settings.json`).
8. Sem alteração de comportamento funcional no monitor e analytics.
9. Nomenclatura explícita para cada fonte de dados no código alterado.

## Riscos e Mitigações

1. Risco: quebra de import em pacotes consumidores.
   - Mitigação: migração por fase + busca global por `@lite-llm/env`.
2. Risco: lockfile inconsistente.
   - Mitigação: rodar `pnpm install` após ajustes de `package.json`.
3. Risco: rename amplo de classes/tipos gerar churn.
   - Mitigação: separar renome semântico em PR/fase independente.
4. Risco: perda de histórico/dados ao trocar `monitor.db` por `app.db`.
   - Mitigação: migração com rename/cópia controlada + backup prévio do arquivo.
5. Risco: quebra de bootstrap por path legado (`@settings/settings.json`).
   - Mitigação: fallback one-shot para ler arquivo legado durante a transição.
6. Risco: quebra em testes por `vi.mock`/imports antigos.
   - Mitigação: busca global por paths antigos e atualização dos mocks na mesma fase.
7. **NOVO**: Risco: `packages/analytics` tem cliente PostgreSQL próprio.
   - Mitigação: extrair para `packages/litellm-repository` antes de outras mudanças
8. **NOVO**: Risco: `packages/monitor` tem cliente SQLite próprio com path hardcoded.
   - Mitigação: extrair para `packages/app-repository` e usar variável de ambiente para path

## Cronograma Sugerido (Estimativa)

| Fase | Esforço | Descrição |
|------|---------|-----------|
| 0 | 1 dia | Decisões de naming e compatibilidade |
| 1 | 2 dias | Rename config → env |
| 2 | 2 dias | Rename settings-repository → agents-repository |
| 3a | 3 dias | Criar litellm-repository + migrar analytics |
| 3b | 2 dias | Criar app-repository + migrar monitor |
| 4 | 1 dia | Verificação técnica |
| 5 | 1 dia | Clareza semântica (opcional) |
| 6 | 2 dias | Contextos no server (opcional) |
| **Total** | **~14 dias** | Execução completa |

> **Nota**: Estimativa conservadora. Fases 1-2 podem ser executadas em paralelo se
> as decisões de compatibilidade forem tomadas antecipadamente.

## Checklist de Execução

```bash
# Verificação antes de iniciar
echo "=== Pacotes que importam @lite-llm/env ==="
grep -r "@lite-llm/env" --include="*.ts" --include="*.tsx" -l

echo "=== Pacotes que importam @lite-llm/agents-repository ==="
grep -r "@lite-llm/agents-repository" --include="*.ts" --include="*.tsx" -l

echo "=== Arquivos com vi.mock de pacotes antigos ==="
grep -r "vi.mock.*config\|vi.mock.*settings-repository" --include="*.test.ts" -l
```
