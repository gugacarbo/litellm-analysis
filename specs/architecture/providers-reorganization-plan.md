# Reorganização dos Providers de Informação

## Objetivo

Organizar as fontes de dados e configuração por responsabilidade clara, reduzir
ambiguidade de nomenclatura (`db` genérico), e preparar uma migração segura de
`packages/config` para `packages/env`.

## Escopo Atual

Hoje existem quatro fontes/provedores principais:

1. `settings-repository` (renome planejado para `agents-repository`):
   leitura/escrita de `@settings/settings.json` (alvo: `@settings/agents.json`).
2. `monitor.db` (SQLite): monitoramento, alertas e health-check.
3. Banco principal do LiteLLM (PostgreSQL): gastos, erros, credenciais e roteamento.
4. `packages/config`: validação e carga de env vars de web/server.

## Mudanças Sugeridas

## 1) Renomear `packages/config` para `packages/env`

### Mudanças de estrutura

1. Renomear pasta:
   - `packages/config` -> `packages/env`
2. Renomear pacote:
   - `@lite-llm/config` -> `@lite-llm/env`

### Mudanças de imports (mínimo necessário identificado)

1. `apps/web/src/env.ts`
2. `apps/server/src/env.ts`
3. `packages/analytics/src/queries/client.ts`
4. `packages/server-core/src/orchestration/lite-llm-params.ts`
5. `package.json` de consumidores com dependência `@lite-llm/config`
6. lockfile (`pnpm-lock.yaml`) após `pnpm install`

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

### Decisões adicionais necessárias (faltantes no plano original)

1. Definir se `packages/agents-manager` será mantido como camada de serviço
   (sobre repositories) ou renomeado para `packages/agents-service`.
2. Definir se haverá janela de compatibilidade para imports legados
   (`@lite-llm/config` e `@lite-llm/settings-repository`) com re-export.
3. Confirmar diretório de configuração final:
   - manter `@settings/agents.json`, ou
   - mover para `data/agents.json`.

### Mapa de impacto mínimo (faltante no plano original)

1. `package.json` + `exports` dos pacotes renomeados
   (`@lite-llm/config`, `@lite-llm/settings-repository`).
2. Todos os consumidores com `vi.mock(...)` e imports de subpath
   (`/server`, `/web`, `/repository`, `/queries`).
3. Defaults de bootstrap do server e agents manager:
   - `apps/server/src/runtime/app-runtime.ts`
   - `packages/agents-manager/src/config/defaults.ts`
   - `packages/agents-manager/src/repository/client.ts`
4. Documentação técnica interna (`AGENTS.md`, `specs/*`) para evitar drift.

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

## Fase 0 — Congelar decisões de naming/compatibilidade

1. Decidir destino de `agents-manager` (manter vs renomear).
2. Decidir política de compatibilidade:
   - sem compatibilidade (breaking change imediata), ou
   - compatibilidade temporária com pacotes wrappers.
3. Decidir caminho definitivo do arquivo de configuração:
   `@settings/agents.json` ou `data/agents.json`.

## Fase 1 — Rename do pacote de env

1. Renomear pasta para `packages/env`.
2. Ajustar `name` no `package.json` para `@lite-llm/env`.
3. Atualizar imports `@lite-llm/config/*` -> `@lite-llm/env/*`.
4. Atualizar dependências nos `package.json` consumidores.
5. Rodar `pnpm install` para atualizar lockfile.
6. Atualizar `exports` do pacote para manter subpaths:
   `@lite-llm/env/server` e `@lite-llm/env/web`.

## Fase 2 — Migração de settings para agents

1. Renomear pacote:
   - `packages/settings-repository` -> `packages/agents-repository`
   - `@lite-llm/settings-repository` -> `@lite-llm/agents-repository`
2. Renomear contratos:
   - `IDbRepository` -> `IAgentsRepository`
   - `DbRepository` -> `AgentsRepository`
3. Renomear arquivo:
   - `@settings/settings.json` -> `@settings/agents.json`
4. Ajustar defaults/bootstrapping para novo nome de arquivo.
5. Atualizar mensagens de erro e validação para `agents.json`.
6. (Opcional) manter wrapper temporário de `settings-repository` com re-export.

## Fase 3 — Extração dos repositories de banco

1. Criar `packages/litellm-repository` e mover acesso ao PostgreSQL para ele.
2. Atualizar `packages/analytics` para consumir esse novo repository.
3. Criar/renomear `packages/app-repository` e mover acesso ao SQLite local.
4. Renomear o arquivo de banco local de `db/monitor.db` para `db/app.db`.
5. Atualizar `packages/monitor` para consumir `@lite-llm/app-repository`.
6. Implementar migração one-shot de arquivo:
   - se `db/monitor.db` existir e `db/app.db` não existir, copiar/renomear.
   - gerar backup antes da migração (`db/monitor.db.bak`).

## Fase 4 — Verificação técnica

1. `pnpm -w typecheck`
2. `pnpm -w test`
3. `pnpm -w build`
4. Smoke test manual:
   - subir app (`pnpm dev`)
   - validar CRUD de agentes/categorias
   - validar monitor + health-check + alerts

## Fase 5 — Clareza semântica (opcional, recomendada)

1. Aplicar renames de tipos/classes no `agents-repository`.
2. Atualizar nomes de variáveis/serviços com `db` ambíguo.
3. Ajustar mensagens de erro para refletir o arquivo real.
4. Limpar compatibilidade temporária (se adotada na Fase 0).

## Fase 6 — Contextos no server (opcional)

1. Extrair facades por contexto.
2. Delegar montagem final ao `server-core`.
3. Validar regressão com testes de integração do server.

## Critérios de Aceite

1. Nenhum import restante de `@lite-llm/config`.
2. Nenhum import restante de `@lite-llm/settings-repository`
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
   - Mitigação: migração por fase + busca global por `@lite-llm/config`.
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
