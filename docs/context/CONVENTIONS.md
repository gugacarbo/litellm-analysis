# Convenções de Projeto

> Estado atual, imperativo e atemporal. Decisões datadas → `docs/adr/`.
> Carregar ao implementar features, code review ou onboarding.

## Nomenclatura

| Contexto                | Convenção                                                                            | Exemplo                                      |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| API / TypeScript (novo) | `camelCase`                                                                          | `modelRoute`, `inputCostPerToken`            |
| Colunas PostgreSQL      | `snake_case`                                                                         | `model_name`, `input_cost_per_token`         |
| Tabelas do proxy        | prefixo `model_proxy_`                                                               | `model_proxy_models`, `model_proxy_settings` |
| Tipos de modelo         | `modelRoute` (NUNCA `litellmParams`)                                                 | `ModelRoute`, `model-route.ts`               |
| Estados de sync         | `synced`, `config-only`, `registry-only`, `config-to-registry`, `registry-to-config` | —                                            |
| Providers               | nomes neutros (NUNCA `litellm`)                                                      | `local-proxy`, `openai-compatible`           |

**Proibido:** usar `litellmParams`, `litellm-only`, `config-to-litellm`, `litellm-to-config`, `LiteLLM_*` em código novo ou UI.

## Segurança

### Credenciais upstream
- **NUNCA** persistir segredo bruto no banco.
- Campo canônico: `secretRef` (nome de env var, ex. `OPENAI_API_KEY`).
- `secretRef` **NÃO** usa prefixo `env:` — é o nome exato da variável.
- Writes no campo `apiKey` são **rejeitados** no service layer.
- Credenciais upstream **NUNCA** aparecem em artefatos gerados (OpenCode, VS Code, OpenAgent).

### API keys locais (proxy)
- Hash **argon2id** (preferido) ou **bcrypt** com cost ≥ 10.
- Plaintext retornado **apenas uma vez** na resposta HTTP de criação.
- Coluna `keyHash` é `@unique`; nunca armazenar plaintext.
- Bootstrap: `MODEL_PROXY_API_KEY` aceita quando tabela `model_proxy_api_keys` está vazia (dev apenas).

## Acesso a dados

### ORM
- **Drizzle ORM** é o único ORM do monorepo. Prisma e `better-sqlite3` foram removidos.
- Package central: `@lite-llm/database` em `repositories/database`.
- Schemas em `repositories/database/src/schema/`.
- Migrations em `repositories/database/drizzle/` (descartáveis — schema é fonte da verdade).

### Política de leitura/escrita
- **Single-write:** todo write operacional vai para tabelas `model_proxy_*`.
- **Dual-read:** leitura consulta registry primeiro, com fallback para adapters legados.
- **Proibido:** escrever em tabelas `LiteLLM_*`; dual-write registry + LiteLLM.

### Fonte da verdade
- **Banco de dados PostgreSQL** é a única fonte de verdade para agentes, modelos, plugins e configurações.
- Pasta `@settings/` foi removida. Nenhum código depende dela.
- Scripts `settings:import` e `settings:export` foram removidos.

## Configuração operacional

- Tabela `model_proxy_settings` (chave-valor JSON).
- Chaves: `default_credential`, `health_check_prompt`, `router_settings`.
- Metadados de aliases em `router_settings.value.__lite_llm_analytics.*`.
- Leitura: `model_proxy_settings` primeiro → fallback `LiteLLM_Config` via adapter.

## Modelos e providers

- Registry primário: `model_proxy_models` + `model_proxy_providers`.
- Tipo público: `modelRoute` (API rejeita `litellmParams` com erro 4xx — hard cut, sem shim).
- Resposta expõe apenas `modelRoute`; `litellmParams` é rejeitado com 4xx.
- Provider-scoped routing: `providerName/modelName` (SPEC-0002).
- `is_default_provider` define resolução padrão quando há múltiplos providers para o mesmo modelo.

## API e erros

- Envelope de erro padrão (definir conforme implementação do server).
- Autorização via `Authorization: Bearer <key>` validada contra `model_proxy_api_keys`.
- Ordem de auth: 1) DB (`keyHash` match + `enabled`), 2) fallback `MODEL_PROXY_API_KEY`.

## Testes

- Comando canônico: `pnpm test` (tudo verde).
- Typecheck: `pnpm typecheck` (exit 0 em todos os packages).
- Testes de repositório usam `pg-mem` (Drizzle in-memory) — helper `createTestDb()` do `@lite-llm/database`.
- Bugfix: teste de regressão ANTES do fix.

## Docs

- ADRs em `docs/adr/` (template: `docs/templates/adr.template.md`).
- Specs em `docs/specs/` (template: `docs/templates/spec.template.md`).
- Contexto em `docs/context/` (capítulos imperativos e atemporais).
- Validar: `scripts/docs-check`; regenerar índices: `scripts/docs-check --emit-index`.
- READMEs de `adr/` e `specs/` são **gerados** — não editar à mão.
