---
status: accepted
date: 2026-07-01
builds-on: []
implemented-by: []
---

# Database becomes the single source of truth for agents, models, and plugins

## Objetivo

Eliminar `@settings/` como fonte de verdade versionada para agentes, modelos e plugins.
O banco de dados passa a ser a única fonte de verdade.
Os serviços, plugins e scripts passam a ler e escrever configurações apenas por meio
dos repositórios e da API CRUD existente.
A pasta `@settings/` e seus arquivos JSONC/JSON Schema gerados são removidos do workspace.

## Fluxo

1. O agente inspeciona o workspace e identifica todo código, script, teste e documentação
   que referencia `@settings/`.
2. Para cada leitor de `@settings/`, o agente substitui a leitura pelo respectivo repositório
   ou chamada à API CRUD que consulta o banco.
3. Plugin runners que geram arquivos em `@storage/output/` passam a consumir os dados do banco;
   os arquivos de saída continuam existindo, mas a fonte de entrada muda.
4. Scripts `settings:import` e `settings:export` são removidos de `package.json`.
5. `scripts/docs-check` é atualizado para não validar mais `@settings/` contra schemas JSON.
6. A documentação (`README.md`, `docs/`) é atualizada para refletir que o DB é a fonte única.
7. Após validação (`npm run typecheck`, `npm test`, `pnpm docs-check`) e busca residual por
   referências a `@settings/`, a pasta `@settings/` é removida.
8. O status da spec muda para `implemented` no mesmo commit de entrega.

## Contrato

- O banco de dados é a única fonte de verdade para agentes, modelos e plugins.
- Nenhum serviço, script, teste ou documentação do repositório pode depender de `@settings/`.
- Os artefatos em `@storage/output/` (ex.: `vscode-oaicopilot.json`, `opencode.json`,
  `model-aliases.json`) continuam sendo gerados a partir do banco.
- A API CRUD existente permanece como único canal de escrita.
- Não haverá compatibilidade retroativa ou fallback para `@settings/`.
- Nenhuma migração de dados dos JSONC para o DB será realizada; os dados já presentes no DB
  permanecem inalterados.

## Casos de borda

| # | QUANDO o banco estiver vazio ou sem um agente/modelo/plugin esperado | o sistema DEVE continuar funcionando dentro do estado do DB, sem recorrer a `@settings/` |
| 2 | QUANDO um plugin runner for executado | o sistema DEVE gerar o arquivo de saída correspondente a partir dos dados do banco |
| 3 | QUANDO uma documentação citar `@settings/` como fonte de verdade | o sistema DEVE rejeitar a doc e exigir correção |
| 4 | QUANDO um teste referenciar arquivos de `@settings/` | o sistema DEVE atualizar o teste para usar stubs/fábricas de DB |

## Questões em aberto

- [x] Nenhuma.

## Definition of Done

```bash
npm run typecheck        # exit 0
npm test                 # tudo verde
pnpm docs-check          # exit 0
```

Além disso:
- [x] Nenhuma referência a `@settings/` em código, scripts, configurações ou documentação.
- [x] Plugin runners geram `@storage/output/` a partir do banco.
- [x] API CRUD de agentes, modelos e plugins continua operacional.

## Revisão humana

- Revisar se a remoção de `@settings/` não quebra nenhum fluxo operacional externo ao repo.
- Confirmar que todos os consumidores de `@settings/` foram encontrados.

## Verificação

```text
(preencher no fechamento)
```
