# Batch 5: consumidores e remocao final

## Status

- [x] Consumidores do proxy (health-check, prompt-eval, plugins) migrados para
  `modelProxyConfig` / `MODEL_PROXY_*`.
- [x] Plugin `litellm-alias` renomeado para `model-alias`; generators OpenCode e
  VS Code emitem `local-proxy`.
- [ ] Analytics, backup, `.env.example`, README e runtime ainda dependem do
  banco/schema LiteLLM (Batch 4 pendente).
- [ ] `pnpm dev` ainda pode exigir PostgreSQL LiteLLM para dashboards de spend.

## Objetivo

Migrar consumidores, arquivos gerados, scripts e documentacao para o proxy novo
e remover o LiteLLM do runtime principal. Ao final deste batch, `pnpm dev` deve
subir sem container LiteLLM e configs novas nao devem usar nomenclatura
`litellm*`.

## Antecipado (ja entregue com Batch 1)

Itens abaixo ja estao no codigo; o batch 5 fecha o que falta (docs, backup,
analytics, remocao de fallbacks).

| Area | Estado |
|------|--------|
| Health-check → proxy local | `modelProxyBaseUrl` / `modelProxyApiKey` |
| Prompt-eval defaults | `EVAL_PROVIDER=model-proxy`, base/key do proxy |
| Plugin context | `modelProxyConfig` (sem `litellmConfig`) |
| Provider gerado | `local-proxy` (OpenCode, VS Code) |
| Plugin rename | `model-alias`, output `model-aliases.json` |
| API key em configs | `env:MODEL_PROXY_API_KEY` em `models.jsonc` e VS Code |
| Shim legado (borda) | `litellm-alias` → `model-alias` em plugin-routing routes |
| Adapter prompt-eval | aceita `litellm` como alias de `model-proxy` |

## Checklist de Preparacao

- [ ] Confirmar que Batch 4 funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Definir janela final de suporte a adapters legados.
- [ ] Listar todos os arquivos gerados em `@storage/output`.
- [ ] Listar env vars `LITELLM_*` restantes no runtime.
- [ ] Listar docs/scripts que ainda falam em LiteLLM como runtime.
- [ ] Confirmar que importadores historicos ficam offline/opcionais.

## Checklist de Implementacao

### Consumidores do proxy

- [x] Migrar health-check para o proxy local.
- [x] Preservar streaming do health-check.
- [x] Preservar TTFT do health-check.
- [x] Preservar `provider_specific_fields.reasoning_content`.
- [x] Preservar fallback sem `reasoning_effort`.
- [x] Migrar prompt-eval para `EVAL_PROVIDER=model-proxy` (default no runtime).
- [x] Migrar prompt-eval para `EVAL_BASE_URL` apontando para `/v1`
  (fallback `MODEL_PROXY_BASE_URL`).
- [x] Migrar prompt-eval para `EVAL_API_KEY` com chave local do proxy
  (fallback `MODEL_PROXY_API_KEY`).
- [x] Migrar contexto de plugins de `litellmConfig` para `modelProxyConfig`.

### Generators e nomenclatura

- [x] Renomear provider gerado `litellm` para `local-proxy`.
- [x] Renomear plugin `litellm-alias` para `model-alias`.
- [x] Trocar `{env:LITELLM_API_KEY}` por `{env:MODEL_PROXY_API_KEY}` (VS Code;
  `models.jsonc` usa `env:MODEL_PROXY_API_KEY`).
- [x] Atualizar generator do OpenCode.
- [x] Atualizar generator do VS Code.
- [x] Atualizar generator do OpenAgent (contexto `modelProxyConfig`; output nao
  inclui bloco de provider).
- [ ] Regenerar configs em `@storage/output` (artefatos locais / gitignored).
- [x] Atualizar testes dos plugins.
- [x] Atualizar snapshots/fixtures de plugins (cobertos pelos testes atuais).

### Remocao final e operacao

- [ ] Migrar backup para o banco PostgreSQL novo.
- [ ] Migrar `backup:list`.
- [ ] Atualizar `.env.example` (ainda cita `LITELLM_API_URL` / `LITELLM_API_KEY`).
- [ ] Atualizar README (ainda cita `VITE_LITELLM_*`).
- [ ] Atualizar docs principais (`AGENTS.md` parcialmente atualizado).
- [ ] Atualizar scripts que citam LiteLLM como runtime (`scripts/src/litellm-backup`,
  `scripts/src/sync-cloud-litellm` permanecem historicos).
- [ ] Remover fallbacks `LITELLM_*` do runtime principal.
- [ ] Remover dependencia obrigatoria de `repositories/litellm-repository`.
- [x] Manter importadores historicos fora do runtime.
- [ ] Validar `pnpm dev` sem container LiteLLM.

## Fora de Escopo

- [ ] Nao adicionar budget/rate limit neste batch, salvo se ja decidido antes.
- [ ] Nao adicionar adapter Anthropic nativo neste batch, salvo se ja existir.
- [ ] Nao manter suporte indefinido a arquivos gerados antigos.

## Checklist de Validacao

- [ ] `@storage/output/opencode.json` usa `local-proxy` (regenerar localmente).
- [x] Configs novas em `@settings` usam `MODEL_PROXY_API_KEY` / `local-proxy`.
- [x] Generators novos nao emitem provider `litellm`.
- [x] Generators e `@settings/plugins` nao usam plugin `litellm-alias`.
- [x] Health-check roda pelo proxy local.
- [x] Prompt-eval default aponta para o proxy local (requer env em deploy).
- [ ] Backup mira o banco PostgreSQL novo.
- [ ] `pnpm dev` sobe sem LiteLLM.
- [ ] Dashboard funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [x] Rotas `/v1/*` e health-check nao exigem `LITELLM_API_URL`.
- [x] Rotas `/v1/*` e health-check nao exigem `LITELLM_API_KEY`.
- [ ] Spend/analytics deixa de exigir banco LiteLLM (Batch 4).

## Checks

- [x] `pnpm --filter @lite-llm/agent-plugins typecheck`
- [x] `pnpm --filter @lite-llm/prompt-eval typecheck`
- [x] `pnpm --filter @lite-llm/server typecheck`
- [x] `pnpm --filter @lite-llm/monitor typecheck`
- [x] `pnpm test`
- [x] `pnpm build`

## Criterios de Pronto

- [ ] LiteLLM nao faz parte do runtime principal.
- [x] Configs novas em `@settings` usam nomenclatura do proxy novo.
- [ ] Scripts e docs principais falam em model proxy, nao em LiteLLM runtime.
- [x] Importadores historicos continuam disponiveis fora do runtime.
- [ ] `pnpm dev` e `pnpm build` funcionam sem container LiteLLM
  (`pnpm build` ok; `pnpm dev` ainda depende do banco LiteLLM para analytics).
