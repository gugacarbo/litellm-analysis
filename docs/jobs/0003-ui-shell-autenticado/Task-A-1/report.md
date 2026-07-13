# Task-A-1 — Correção do baseline documental da SPEC-0002

## Resultado

Concluído. A evidência histórica de verificação da SPEC-0002 foi movida para `docs/verification/`, as referências reais na SPEC, no plano e no registry 0002 foram atualizadas, e os valores `implemented-by` agora apontam para os diretórios `Task-*-1` existentes.

## TDD

N/A — esta é uma alteração documental sem comportamento de produto.

## Arquivos alterados

- `docs/verification/0002-fundacao-ui-tanstack-start.md` — evidência histórica preservada no diretório de verificação.
- `docs/specs/verification/0002-fundacao-ui-tanstack-start.md` — removido após a movimentação.
- `docs/specs/0002-fundacao-ui-tanstack-start-spec.md` — paths `implemented-by` reais e referência à evidência atualizados.
- `docs/plans/0002-fundacao-ui-tanstack-start.md` — referências à evidência atualizadas.
- `docs/jobs/0002-fundacao-ui-tanstack-start/super-plan.json` — inventário da Task-E-1 atualizado para o novo path.
- `docs/index.json` e `docs/specs/README.md` — regenerados pelo `docs-check --emit-index`.

## Verificação

- `git diff --check -- <arquivos da task>` — exit 0.
- `rg -n 'docs/specs/verification/0002-fundacao-ui-tanstack-start.md' <SPEC, plano e registry 0002>` — sem ocorrências.
- `pnpm docs-check --emit-index` — exit 0: `9 docs · 0 erro(s) · 0 aviso(s)`.

## Escopo

Nenhum arquivo de produção em `apps/ui` foi alterado. As mudanças limitam-se à documentação histórica 0002, aos índices documentais gerados e a este relatório de task.

## Concerns

Nenhuma. A regeneração dos índices também incorpora a SPEC-0003 já presente no worktree, conforme o comportamento esperado de `--emit-index`.
