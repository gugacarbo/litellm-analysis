# Task-B-0001 Report

## Resumo

- Conclui o slice de `Task-B-0001` no resolver do `llm-gateway`.
- Mantive a resolucao por `provider/model` e por bare model name com lookup proprio no banco.
- Ajustei o resolver para distinguir tres casos quando existem varias linhas para o mesmo `modelName`: default unico, ambiguidade sem default e configuracao invalida com defaults duplicados.
- Reescrevi a suite de `upstream-provider.test.ts` para o contrato novo e alinhei `service.test.ts` ao caminho atual baseado em `findMany`.
- Nao alterei o catalogo Hebo nem expandi o escopo para alem do necessario para o contrato do resolver.

## Arquivos alterados

- `services/llm-gateway/src/resolver/upstream-provider.ts`
- `services/llm-gateway/src/resolver/upstream-provider.test.ts`
- `services/llm-gateway/src/service.test.ts`
- `docs/tasks/0002-provider-model-routing-and-db-source/task-Task-B-0001-report.md`

## Decisoes

- Preservei `parseProviderModel()` com split apenas no primeiro `/`, mantendo `/model` e `provider/` como bare model names, conforme o requisito.
- Mantive `resolveUpstreamTarget()` aceitando `modelName` cru e fazendo o lookup proprio:
  - com prefixo: `findFirst({ modelName: bareModelName, providerName: providerPrefix })`
  - sem prefixo: `findMany({ modelName: bareModelName })`
- Preservei backward compatibility para bare model name quando existe:
  - uma unica linha no banco
  - uma linha com `providerName = NULL`
  - um fallback model sem linha selecionada
- Para multiplas linhas do mesmo modelo:
  - 1 default: resolve essa linha
  - 0 defaults: erro de ambiguidade orientando uso de `provider/model`
  - >1 defaults: erro explicito de configuracao invalida, refletindo o "should never happen" da spec
- Nao editei `services/llm-gateway/src/service.ts` porque o contrato novo ja estava consistente no estado atual do workspace; so alinhei os mocks de `service.test.ts`.

## Verificacoes executadas

- Comando:

```bash
rtk proxy pnpm --filter @lite-llm/llm-gateway test -- --run src/resolver/upstream-provider.test.ts src/service.test.ts
```

- Resultado:
  - `Test Files  8 passed (8)`
  - `Tests  51 passed (51)`

## Riscos pendentes

- O resolver ainda retorna `Error` simples; a traducao para status HTTP 400/404/500 continua dependente das camadas chamadoras.
- O caminho do catalogo Hebo para ids canonicos `provider/model` continua fora deste slice e segue para `Task-B-0002`.
- Existem alteracoes paralelas ja presentes no workspace, especialmente em `services/llm-gateway/src/service.ts`; este trabalho foi feito por composicao com esse estado, sem revert-lo.
