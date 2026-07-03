# Hard Cut Legacy Compat Cleanup Implementation Plan

> **For agentic workers:** use subagent-driven development to implement this plan task-by-task.
> The executable source of truth is `docs/tasks/0005-hard-cut-legacy-compat-cleanup/tasks.json`.

**Goal:** remover todo código legado, deprecated, compatibilidade e LiteLLM-only do app, consolidando contratos, adapters e runtime em uma única forma atual e limpa.

**Architecture:** o trabalho será um hard cut transversal: primeiro consolidamos o contrato canônico de modelos, sync e credenciais; depois removemos os caminhos de runtime e proxy que ainda aceitam formatos antigos; em seguida limpamos plugins, frontend e analytics; por fim deletamos código morto, testes obsoletos e docs que ainda descrevem a migração. O resultado esperado é um app que conhece apenas o contrato atual e não tenta traduzir payloads, nomes ou formatos antigos em nenhuma borda interna.

**Tech Stack:** TypeScript, Express, Drizzle ORM, React, Zod, Vitest, JSON Schema, PostgreSQL.

## Global Constraints

- Quebrar totalmente payloads, nomes e formatos antigos; apenas consumidores atuais deste repo são válidos.
- Remover todo código `legacy`, `compat`, `deprecated` e tudo que exista só para LiteLLM ou para a migração dele.
- Preservar apenas a superfície atual do produto que continua válida, incluindo o proxy `/v1` OpenAI-compatible.
- Reescrever adapters para um fluxo unidirecional simples; nenhum adapter deve continuar traduzindo contratos antigo <-> novo.
- `model_proxy_*` continua sendo a única fonte de verdade operacional; não reintroduzir dual-read, dual-write ou stores paralelos de compatibilidade.
- Credenciais upstream devem ficar no contrato canônico atual; remover caminhos antigos baseados em `apiKey` legada, `env:` shim ou secret literal persistido por compatibilidade.
- Tipos, testes e docs devem ser limpos no mesmo corte; nenhum nome `litellm*` deve permanecer quando representar apenas compatibilidade histórica.
- Ao remover código morto, preferir exclusão direta a deixar wrappers vazios ou aliases temporários.

## File Structure

| File/Directory | Owner Task | Notes |
| --- | --- | --- |
| `services/llm-config-service/src/adapters/model-route-adapter.ts` | `Task-A-0001` | Simplificar para contrato atual de `ModelRoute` apenas |
| `services/llm-config-service/src/types/model-route.ts` | `Task-A-0001` | Remover route params e mapeamentos LiteLLM legados |
| `services/llm-config-service/src/types/sync-status.ts` | `Task-A-0001` | Eliminar normalizações e aliases de sync antigos |
| `packages/server/src/orchestration/route-params.ts` | `Task-A-0001` | Parar de ler `litellm_provider_name` e afins |
| `repositories/models-repository/src/db-repository.ts` | `Task-A-0002` | Colapsar bridge config/repository e retirar `env:` shims |
| `services/models-service/src/repository/client.ts` | `Task-A-0002` | Ajustar serviços para o contrato canônico limpo |
| `services/llm-config-service/src/lib/provider-secrets.ts` | `Task-A-0002` | Consolidar leitura de segredo para `secretRef` atual |
| `services/llm-config-service/src/repositories/` | `Task-A-0002` | Limpar contratos e writes/reads legados de providers/settings/models |
| `packages/server/src/routes/model-routes.ts` | `Task-B-0001` | Remover sync, diff e payload acceptance legados |
| `packages/server/src/routes/model-proxy-routes.ts` | `Task-B-0001` | Consolidar auth do proxy sem fallback de compatibilidade |
| `services/llm-gateway/src/resolver/upstream-provider.ts` | `Task-B-0001` | Eliminar fallbackModels e caminhos antigos de credencial/provider |
| `services/llm-gateway/src/service.ts` | `Task-B-0001` | Parar de usar listagens/resoluções derivadas de store compatível |
| `packages/server/src/routes/plugin-routing-routes.ts` | `Task-B-0002` | Aceitar apenas payload/config atual dos plugins |
| `services/agent-plugins/src/plugin-registry.ts` | `Task-B-0002` | Remover APIs e comentários de compatibilidade V1 |
| `services/agent-plugins/src/plugins/model-alias/` | `Task-B-0002` | Deletar se for apenas legado/manual compatibility |
| `apps/web/src/shared/lib/api-client/models.ts` | `Task-C-0001` | Remover deprecated fields e normalizações antigas |
| `apps/web/src/shared/lib/api-client/spend.ts` | `Task-C-0001` | Aceitar apenas ledger/payload atual do proxy |
| `apps/web/src/features/models/` | `Task-C-0001` | Alinhar UI e queries ao contrato novo, sem aliases antigos |
| `apps/web/src/features/plugins/` | `Task-C-0001` | Ajustar superfícies afetadas pelo corte de plugins |
| `docs/context/CONVENTIONS.md` | `Task-D-0001` | Atualizar contexto para refletir o hard cut |
| `docs/index.json` | `Task-D-0001` | Regenerar após a limpeza de docs |

## Task Registry

- **Registry:** `docs/tasks/0005-hard-cut-legacy-compat-cleanup/tasks.json`
- **Progress ledger:** `docs/tasks/0005-hard-cut-legacy-compat-cleanup/progress-ledger.md`
- **Task directories:** `docs/tasks/0005-hard-cut-legacy-compat-cleanup/<task-id>/`
- **Task-local logs:** `docs/tasks/0005-hard-cut-legacy-compat-cleanup/<task-id>/progress.log`
- **Task-local logger:** `docs/tasks/0005-hard-cut-legacy-compat-cleanup/<task-id>/log-task.sh`

---
