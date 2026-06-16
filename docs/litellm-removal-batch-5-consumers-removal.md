# Batch 5: consumidores e remocao final

## Objetivo

Migrar consumidores, arquivos gerados, scripts e documentacao para o proxy novo
e remover o LiteLLM do runtime principal. Ao final deste batch, `pnpm dev` deve
subir sem container LiteLLM e configs novas nao devem usar nomenclatura
`litellm*`.

## Checklist de Preparacao

- [ ] Confirmar que Batch 4 funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Definir janela final de suporte a adapters legados.
- [ ] Listar todos os arquivos gerados em `@storage/output`.
- [ ] Listar env vars `LITELLM_*` restantes no runtime.
- [ ] Listar docs/scripts que ainda falam em LiteLLM como runtime.
- [ ] Confirmar que importadores historicos ficam offline/opcionais.

## Checklist de Implementacao

- [ ] Migrar health-check para o proxy local.
- [ ] Preservar streaming do health-check.
- [ ] Preservar TTFT do health-check.
- [ ] Preservar `provider_specific_fields.reasoning_content`.
- [ ] Preservar fallback sem `reasoning_effort`.
- [ ] Migrar prompt-eval para `EVAL_PROVIDER=model-proxy`.
- [ ] Migrar prompt-eval para `EVAL_BASE_URL` apontando para `/v1`.
- [ ] Migrar prompt-eval para `EVAL_API_KEY` com chave local do proxy.
- [ ] Migrar contexto de plugins de `litellmConfig` para `modelProxyConfig`.
- [ ] Renomear provider gerado `litellm` para `local-proxy`.
- [ ] Renomear plugin `litellm-alias` para `model-alias`.
- [ ] Trocar `{env:LITELLM_API_KEY}` por `{env:MODEL_PROXY_API_KEY}`.
- [ ] Atualizar generator do OpenCode.
- [ ] Atualizar generator do VS Code.
- [ ] Atualizar generator do OpenAgent.
- [ ] Regenerar configs em `@storage/output`.
- [ ] Atualizar testes dos plugins.
- [ ] Atualizar snapshots/fixtures de plugins.
- [ ] Migrar backup para o banco PostgreSQL novo.
- [ ] Migrar `backup:list`.
- [ ] Atualizar `.env.example`.
- [ ] Atualizar README.
- [ ] Atualizar docs principais.
- [ ] Atualizar scripts que citam LiteLLM como runtime.
- [ ] Remover fallbacks `LITELLM_*` do runtime principal.
- [ ] Remover dependencia obrigatoria de `repositories/litellm-repository`.
- [ ] Manter importadores historicos fora do runtime.
- [ ] Validar `pnpm dev` sem container LiteLLM.

## Fora de Escopo

- [ ] Nao adicionar budget/rate limit neste batch, salvo se ja decidido antes.
- [ ] Nao adicionar adapter Anthropic nativo neste batch, salvo se ja existir.
- [ ] Nao manter suporte indefinido a arquivos gerados antigos.

## Checklist de Validacao

- [ ] `@storage/output/opencode.json` usa `local-proxy`.
- [ ] Configs novas usam `MODEL_PROXY_API_KEY`.
- [ ] Nenhum arquivo gerado novo usa provider `litellm`.
- [ ] Nenhum arquivo gerado novo usa plugin `litellm-alias`.
- [ ] Health-check roda pelo proxy local.
- [ ] Prompt eval roda pelo proxy local.
- [ ] Backup mira o banco PostgreSQL novo.
- [ ] `pnpm dev` sobe sem LiteLLM.
- [ ] Dashboard funciona com `ANALYTICS_DATA_SOURCE=model-proxy`.
- [ ] Runtime principal nao exige `LITELLM_API_URL`.
- [ ] Runtime principal nao exige `LITELLM_API_KEY`.

## Checks

- [ ] `pnpm --filter @lite-llm/agent-plugins typecheck`
- [ ] `pnpm --filter @lite-llm/prompt-eval typecheck`
- [ ] `pnpm --filter @lite-llm/server typecheck`
- [ ] `pnpm --filter @lite-llm/monitor typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Criterios de Pronto

- [ ] LiteLLM nao faz parte do runtime principal.
- [ ] Configs novas usam somente nomenclatura do proxy novo.
- [ ] Scripts e docs principais falam em model proxy, nao em LiteLLM runtime.
- [ ] Importadores historicos continuam disponiveis fora do runtime.
- [ ] `pnpm dev` e `pnpm build` funcionam sem container LiteLLM.

