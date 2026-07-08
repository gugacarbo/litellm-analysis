---
status: deprecated
date: 2026-07-02
builds-on: []
implemented-by: []
---

# Migrar toda a camada de dados de Prisma para Drizzle, unificando PostgreSQL

> Convenções compartilhadas (envelope de erro, autorização, acesso a dados):
> `docs/context/CONVENTIONS.md`. Esta spec não as repete — só desvia delas
> explicitamente quando necessário.

## Objetivo

Eliminar o Prisma do monorepo, migrando toda a camada de acesso a dados para
Drizzle ORM sobre PostgreSQL. Como parte da migração, unificar o banco do
`app-repository` (hoje SQLite) no mesmo PostgreSQL do `model-proxy-repository`,
removendo a dependência `better-sqlite3`. Ao final, nenhum código Prisma deve
sobreviver no repositório e o único ORM do monorepo é Drizzle.

> **Premissa de desenvolvimento**: o projeto está em desenvolvimento ativo e o
> banco pode ser resetado a qualquer momento. Portanto:
> - **Não preservar dados** (nem do SQLite, nem do PostgreSQL do proxy);
> - **Não deixar suporte/fallback legacy ou deprecated** — migração é big bang
>   e limpa;
> - **Migrations são descartáveis**: podem ser apagadas/editadas/removidas
>   quando não mais utilizadas. O schema Drizzle é a fonte de verdade.

## Fluxo

### Criação do package compartilhado de banco

1. É criado o package `@lite-llm/database` em `database`.
2. Esse package concentra:
   - o pool PostgreSQL compartilhado (via `pg` + `drizzle-orm/node-postgres`),
     lendo `DATABASE_URL` de `@lite-llm/config/server`;
   - todos os schemas Drizzle do monorepo (tabelas `model_proxy_*` e tabelas
     `app_*` que hoje vivem no SQLite);
   - o client Drizzle `db` exportado como singleton;
   - os scripts `db:generate`, `db:migrate`, `db:push`, `db:studio` via
     `drizzle-kit`.
3. Os repositórios de domínio (`app-repository`, `model-proxy-repository`)
   passam a **re-exportar** schemas e client do `database`, mantendo seus
   barrels públicos (`./schema`, `./client`, `./queries`) para não quebrar
   consumidores.

### Schema Drizzle do model-proxy

4. As 9 tabelas `model_proxy_*` atuais são reescritas em Drizzle
   (`pgTable`) em `database/src/schema/model-proxy.ts`,
   espelhando exatamente o schema Prisma atual:
   `model_proxy_requests`, `model_proxy_usage_adjustments`,
   `model_proxy_messages`, `model_proxy_models`, `model_proxy_providers`,
   `model_proxy_api_keys`, `model_proxy_settings`, `model_proxy_aliases`,
   `model_proxy_import_jobs`.
5. Índices, constraints `@unique`, relações e `onDelete: Cascade` do Prisma
   são preservados no schema Drizzle.
6. Defaults do Prisma são traduzidos:
   - `@default(cuid())` → `defaultRandom()` do Drizzle (formato não precisa
     ser compatível com IDs existentes — banco será resetado);
   - `@default(now())` → `defaultNow()`;
   - `@updatedAt` → coluna `updatedAt` com `defaultNow()` **e** o modifier
     `.$onUpdate(() => new Date())` do Drizzle, que atualiza o timestamp
     automaticamente em `update` statements. Repositórios ainda devem setar
     `updatedAt: new Date()` em lógicas que constroem o objeto fora do
     statement SQL.
7. Campos `Json` do Prisma tornam-se `jsonb` no Drizzle (`jsonb()` do
   `drizzle-orm/pg-core`) com type-safety por `.$type<T>()` quando a forma
   do JSON for conhecida; tipos `Prisma.JsonValue` nos consumidores são
   substituídos por `unknown` ou tipo `Json` do Drizzle. Enumerações do Prisma
   são convertidas para `pgEnum()` do `drizzle-orm/pg-core`.

### Schema Drizzle do app-repository (SQLite → PostgreSQL)

8. As tabelas hoje em SQLite (`alerts`, `alert_rules`, `model_health_checks`,
   `prompt_eval_runs` e demais tabelas de prompt eval) são reescritas com
   `pgTable` em `database/src/schema/app.ts`.
9. Tipos são convertidos: `integer` (SQLite epoch) → `timestamp` ou
   `integer` (epoch mantida) conforme semântica atual; `text` JSON → `jsonb`
   quando apropriado; `real` → `doublePrecision` ou `real`.
10. A coluna `model_health_checks.ttft_ms` (adicionada via `ALTER TABLE`
    runtime em `app-repository/src/client.ts`) é formalizada como coluna
    normal do schema Drizzle, removendo o `ensureHealthCheckColumns`.

### Migrations

11. É gerada uma única migration inicial em
    `database/drizzle/` que cria **todas** as tabelas
    (`model_proxy_*` e `app_*`) do zero. **Não há `CREATE TABLE IF NOT
    EXISTS`** — o banco é resetado e recriado limpo.
12. Migrations são descartáveis: podem ser apagadas/editadas/removidas quando
    não mais utilizadas. O schema Drizzle é a fonte de verdade.
13. Os scripts `db:generate`/`db:migrate` de `model-proxy-repository` e
    `app-repository` são substituídos por delegação ao `database`.
14. Transações existentes baseadas em `prisma.$transaction` são migradas para
    `db.transaction(...)` do Drizzle. Execuções raw fora do `analytics-service`
    (`$executeRawUnsafe`, `$queryRaw`) são eliminadas ou movidas para o helper
    `queryRaw<T>()` do `database`.

### Migração dos consumidores

14. `services/model-proxy-config-service` — os repositórios
    (`api-keys-repository.ts`, `models-repository.ts`,
    `providers-repository.ts`, `settings-repository.ts`) trocam
    `prisma.modelProxyX.findMany()` etc. por `db.select().from(modelProxyX)`
    do Drizzle. Tipos `Prisma.XUpdateInput` são substituídos por tipos
    inferidos do schema Drizzle.
15. `services/analytics-service` — as ~46 queries raw SQL trocam o executor
    `prisma.$queryRawUnsafe<T>(sql, ...params)` por um helper
    `queryRaw<T>(sql, params)` do `database` que wrap o `sql` template
    tag do Drizzle. **O SQL das queries permanece idêntico.**
16. `repositories/agents-repository` e `repositories/models-repository` —
    imports de `Prisma`/`PrismaClient` de `@lite-llm/model-proxy-repository`
    são substituídos pelos tipos Drizzle equivalentes.
17. `packages/agents-manager` — referências a Prisma são atualizadas.

### Testes

18. Os helpers `in-memory-prisma.ts` em `agents-repository` e
    `models-repository` são substituídos por Drizzle com `pg-mem`
    (confirmado suficiente para o SQL usado).
19. A cobertura de testes existente é mantida; mocks são adaptados para o
    client Drizzle.

### Remoção do Prisma

20. `repositories/model-proxy-repository/prisma/` e
    `src/generated/prisma/` são removidos.
21. As dependências `prisma` e `@prisma/client` são desinstaladas do
    `model-proxy-repository` e do root.
22. `better-sqlite3` e `@types/better-sqlite3` são desinstalados do
    `app-repository`.
23. Referências a Prisma em `AGENTS.md` e specs são atualizadas.
24. **Nenhum fallback/legacy/deprecated** deve permanecer: a migração é
    limpa e big bang.

### Variáveis de ambiente e CI

25. `MODEL_PROXY_DATABASE_URL` é renomeada para `DATABASE_URL` em
    `@lite-llm/config/server`; `.env.example`, `.env.test` e documentação de
    deploy são atualizados. Variáveis SQLite são removidas.
26. Scripts de CI que executam `prisma generate`, `prisma db push` ou qualquer
    comando Prisma são removidos ou substituídos por `drizzle-kit generate` e
    `drizzle-kit migrate` quando necessário. Comandos `prisma` em `Dockerfile`,
    `docker-compose.yml` e scripts de setup são eliminados.

### Arquivos e pastas a deletar

27. Remover obrigatoriamente:
    - `repositories/model-proxy-repository/prisma/` (schema, migrations, seed, etc.);
    - `repositories/model-proxy-repository/src/generated/prisma/`;
    - arquivos `.prisma` no root e demais packages;
    - `in-memory-prisma.ts` de `repositories/agents-repository` e
      `repositories/models-repository`;
    - SQL de `ALTER TABLE` runtime do `app-repository/src/client.ts`;
    - imports e scripts `prisma`/`better-sqlite3` de todos os `package.json`.

## Contrato

### Package `@lite-llm/database`

- **Exports públicos**:
  - `./client` → `db` (singleton Drizzle), `disconnectDb()`, `queryRaw<T>()`
  - `./schema/model-proxy` → schemas das tabelas `model_proxy_*`
  - `./schema/app` → schemas das tabelas `app_*`
  - `./schema` → barrel re-exportando ambos
  - `./queries` → helpers compartilhados (ex.: builders de filtros, paginação)
    quando repositórios de domínio precisarem de lógica comum.
- **Env**: consome `DATABASE_URL` de `@lite-llm/config/server`; a variável
  `MODEL_PROXY_DATABASE_URL` é removida/renomeada de `.env.example`,
  `.env.test`, documentação e CI.
- **Scripts**: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- **Testes**: o package expõe um helper `createTestDb()` que monta uma instância
  do Drizzle sobre `pg-mem` e aplica `drizzle-kit` migrations, usado por
  `agents-repository`, `models-repository` e demais consumidores que hoje usam
  `in-memory-prisma.ts`.

### Compatibilidade de consumers

- `@lite-llm/model-proxy-repository` mantém seus exports públicos (`./client`,
  `./schema`, `./queries`) re-exportando de `database`, para não quebrar
  consumers existentes.
- `@lite-llm/app-repository` mantém seus exports públicos (`./client`,
  `./schema`, `./queries`) re-exportando de `database`.
- `analytics-service` mantém a interface `AnalyticsDataSource` (46 métodos)
  inalterada; apenas o executor interno das queries muda. As queries continuam
  retornando arrays tipados (`T[]`, não `{ rows: T[] }`).

## Casos de borda

| # | QUANDO ⟨gatilho⟩ | o sistema DEVE ⟨resposta⟩ |
|---|---|---|
| 1 | O schema Drizzle é gerado e o banco é resetado | A migration cria todas as tabelas do zero; **não há** `CREATE TABLE IF NOT EXISTS` nem preservação de dados |
| 2 | Um campo `@updatedAt` do Prisma é escrito via Drizzle sem atualização explícita | O repositório de domínio DEVE setar `updatedAt: new Date()` no payload de update; o `database` não injeta automaticamente |
| 3 | Uma query raw do `analytics-service` usa `::int`/`::float` casts | O helper `queryRaw` do Drizzle preserva o SQL idêntico; apenas o executor muda |
| 4 | Um teste usa `in-memory-prisma.ts` | É substituído por `pg-mem` (suficiente para o SQL usado); o helper expõe a mesma interface de `db` usado em produção |
| 5 | `DATABASE_URL` não está definida | `database` lança erro informativo no boot; mensagem equivalente ao erro do Prisma atual |
| 6 | Um consumer importa `Prisma.JsonValue` | É substituído por `unknown` ou tipo `Json` do Drizzle em todo o monorepo |
| 7 | Um migration não é mais utilizada | É apagada/editada livremente — migrations são descartáveis |
| 8 | Uma transação Prisma é executada via `prisma.$transaction` | É convertida para `db.transaction(...)` do Drizzle |
| 9 | O `analytics-service` executa uma raw query | Usa `queryRaw<T>(sql, params)` do `database` mantendo o SQL idêntico |
| 10 | Um teste boota um banco in-memory | Usa `createTestDb()` do `database` sobre `pg-mem` com migrations aplicadas |

## Questões em aberto

- [x] Confirmar se `pg-mem` cobre o SQL raw usado pelo `analytics-service`
      (com casts `::int`, `date_trunc`, CTEs) — **sim, suficiente**.
- [x] Decidir se o `cuid()` default usa `defaultRandom()` do Drizzle ou um
      helper próprio para manter compatibilidade de formato com IDs existentes
      — **não precisa de formato compatível**, usar `defaultRandom()`.

## Definition of Done

```bash
pnpm typecheck                 # exit 0 em todos os packages
pnpm test                      # tudo verde
pnpm docs-check                # índices e specs consistentes
# Prisma e better-sqlite3 ausentes (case-insensitive, excluindo node_modules/dist);
# comentários e strings acidentais devem ser revisadas manualmente
grep -ri "\bprisma\b" --include="*.ts" --include="*.json" --include="*.prisma" \
  repositories/ services/ packages/ apps/ | grep -v node_modules | grep -v dist
# deve retornar vazio
grep -ri "better-sqlite3" --include="*.ts" --include="*.json" \
  repositories/ services/ packages/ apps/ | grep -v node_modules | grep -v dist
# deve retornar vazio
```

## Revisão humana

- Revisar a tradução de `@updatedAt` em todos os repositórios de domínio para
  garantir que nenhum update esquece de setar `updatedAt`.
- Confirmar que o `analytics-service` retorna os mesmos resultados para as 46
  queries após a troca de executor (comparação de outputs).
- Confirmar que nenhum fallback/legacy/deprecated permaneceu no código.
- Validar que `pg-mem` cobre todos os casts (`::int`, `::float`), funções de
  data (`date_trunc`) e CTEs usados nas 46 queries do `analytics-service`
  com fixture real antes de merge.
- Conferir que `DATABASE_URL` foi propagado em `.env.example`, `.env.test`,
  CI, Docker e AGENTS.md.
- Verificar que `prisma.$transaction`, `$executeRawUnsafe` e `$queryRaw` foram
  removidos de todos os packages.

## Verificação

- [x] 13/13 packages passam typecheck com 0 erros
- [x] `better-sqlite3` eliminado do código-fonte
- [x] Prisma gerado removido de `model-proxy-repository/src/generated/prisma/`
- [x] Migrations SQLite removidas de `app-repository/drizzle/`
- [x] Migrations Prisma removidas de `model-proxy-repository/prisma/migrations/`
- [x] `pnpm-workspace.yaml` sem `allowBuilds` para prisma/better-sqlite3
- [x] `knip.jsonc` sem ignores de prisma
- [x] Root `db:migrate` delega para `@lite-llm/database`
- [x] Spec status alterado para `implemented`
