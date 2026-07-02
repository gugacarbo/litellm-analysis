# Prisma → Drizzle Migration — Progress Ledger

> **Goal:** Eliminate Prisma and SQLite from the monorepo; move all data access to a shared `@lite-llm/database` package backed by Drizzle ORM on PostgreSQL.
> **Spec:** [docs/specs/0004-prisma-to-drizzle-migration-spec.md](docs/specs/0004-prisma-to-drizzle-migration-spec.md)
> **Plan:** [docs/plans/0004-prisma-to-drizzle-migration.md](docs/plans/0004-prisma-to-drizzle-migration.md)
> **Task Registry:** [docs/tasks/0004-prisma-to-drizzle-migration/tasks.json](docs/tasks/0004-prisma-to-drizzle-migration/tasks.json)
> **Progress Log:** [docs/tasks/0004-prisma-to-drizzle-migration/progress.log](docs/tasks/0004-prisma-to-drizzle-migration/progress.log)

| Task        | Title                                                           | Status    | Report | Review |
| ----------- | --------------------------------------------------------------- | --------- | ------ | ------ |
| Task-A-0001 | Ajustar configuração server e variáveis de ambiente              | ⏳ pending | -      | -      |
| Task-A-0002 | Criar package @lite-llm/database com conexão e helper raw       | ⏳ pending | -      | -      |
| Task-A-0003 | Reescrever schema Drizzle do model-proxy em PostgreSQL          | ⏳ pending | -      | -      |
| Task-A-0004 | Reescrever schema Drizzle do app-repository em PostgreSQL       | ⏳ pending | -      | -      |
| Task-A-0005 | Criar barrel de schema e migration inicial única                  | ⏳ pending | -      | -      |
| Task-B-0001 | Converter model-proxy-registry-service repositories para Drizzle | ⏳ pending | -      | -      |
| Task-B-0002 | Converter analytics-service raw queries e data source para Drizzle | ⏳ pending | -      | -      |
| Task-B-0003 | Converter app-repository para re-exportar @lite-llm/database    | ⏳ pending | -      | -      |
| Task-B-0004 | Converter model-proxy-repository para re-exportar @lite-llm/database | ⏳ pending | -      | -      |
| Task-B-0005 | Atualizar consumidores indiretos (agents/models/agents-manager) | ⏳ pending | -      | -      |
| Task-C-0001 | Limpar root, package scripts e Docker/CI de referências Prisma  | ⏳ pending | -      | -      |
| Task-C-0002 | Atualizar documentação de runtime e AGENTS.md                  | ⏳ pending | -      | -      |
| Task-D-0001 | Verificação final e limpeza                                      | ⏳ pending | -      | -      |
