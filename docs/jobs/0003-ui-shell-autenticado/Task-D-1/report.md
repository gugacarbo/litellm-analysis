# Task-D-1 — evidência final e inventário

## Resultado

Pronto para revisão. A matriz final da SPEC-0003 passou integralmente no
worktree compartilhado e a documentação declara somente o shell mínimo que foi
entregue. Nenhuma funcionalidade de domínio do `apps/web` foi migrada.

## Matriz executada

Todos os comandos abaixo foram executados em 13 de julho de 2026 e encerraram
com exit 0.

| Comando                                                                                                                                                   | Resultado real                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm prettier --check docs/spec-decisions/0003_ui_shell_decisions.md docs/context/testing-anti-patterns.md docs/specs/0003-ui-shell-autenticado-spec.md` | `All matched files use Prettier code style!`                                                     |
| `pnpm docs-check --emit-index`                                                                                                                            | `9 docs · 0 erro(s) · 0 aviso(s)`; `docs/index.json` e `docs/specs/README.md` foram regenerados. |
| `pnpm --dir apps/ui exec vitest run --exclude '**/server/auth/invites.test.ts'`                                                                           | 8 arquivos e 27 testes passaram.                                                                 |
| `pnpm --dir apps/ui typecheck`                                                                                                                            | `tsc --noEmit` passou.                                                                           |
| `pnpm --dir apps/ui build`                                                                                                                                | builds client e SSR passaram.                                                                    |
| `git diff --check`                                                                                                                                        | sem saída; nenhum erro de whitespace.                                                            |

## Evidência T1–T9

| ID  | Evidência e resultado                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ |
| T1  | `pnpm docs-check --emit-index` passou com 9 documentos, 0 erros e 0 avisos.                                                          |
| T2  | `ui-preferences.functions.test.ts` passou para fallback de cookie ausente/corrompido e valores canônicos.                            |
| T3  | O mesmo teste passou para `UNAUTHENTICATED` sem `Set-Cookie` e para renovação autenticada de 180 dias.                               |
| T4  | `-__root.test.tsx` e `-__root.ssr.test.tsx` passaram para primeira visita clara/escura, cookies inválido/malformado e HTML SSR.      |
| T5  | `app-sidebar.test.tsx` passou para Dashboard como único link e estado ativo.                                                         |
| T6  | `app-sidebar.test.tsx` passou para drawer inicialmente fechado, fechamento por Escape e não persistência do estado mobile.           |
| T7  | `account-menu.test.tsx` passou para campos públicos e sign-out com sucesso/falha recuperável.                                        |
| T8  | `-_protected.test.ts` passou para redirect anônimo anterior à montagem e slot autenticado do `AppShell`.                             |
| T9  | `typecheck` e `build` passaram; a inspeção `rg` dos arquivos do shell não encontrou `localStorage`, `apps/web` nem chamadas `/api/`. |

O comando Vitest detalhado confirmou os 27 testes; os quatro testes de
`runtime-status` pertencem à fundação existente e também permaneceram verdes.

## Inventário e documentação

- `apps/ui/APP_INVENTORY.md` agora marca somente o shell protegido, as
  preferências em cookie, a navegação Dashboard e o menu/sign-out como
  entregues. Todos os domínios de produto continuam pendentes.
- `docs/specs/0003-ui-shell-autenticado-spec.md` mudou para `implemented`,
  referencia as seis tasks reais e contém a evidência T1–T9 acima.
- `docs/index.json` e `docs/specs/README.md` foram produzidos por
  `docs-check --emit-index`, sem edição manual.

## Revisão de escopo

Esta task alterou apenas os quatro documentos finais declarados e os seus
artefatos de task (este relatório, pacote de revisão e log). Não houve alteração
de código de produção, schema, migrations, convite, papéis, sessão ou rota.

O worktree já continha mudanças compartilhadas fora deste escopo, incluindo
arquivos de `apps/server`, `database`, `apps/web`, scripts de code-check e a
fundação 0002; elas não foram modificadas por esta task. Os arquivos de
implementação não rastreados/alterados do shell pertencem às tasks A–C
concluídas e revisadas.

## Concerns

- O build passou, mas emitiu o aviso já existente de Vite sobre
  `node:crypto` externalizado por `apps/ui/src/server/auth/invites.ts`. Esse
  arquivo está fora do shell e da Task-D-1; não bloqueou o build e não foi
  alterado aqui.
- A revisão humana da SPEC continua pendente: primeira pintura em tema claro e
  escuro, drawer/foco/teclado em viewport mobile e legibilidade do menu de
  conta.
