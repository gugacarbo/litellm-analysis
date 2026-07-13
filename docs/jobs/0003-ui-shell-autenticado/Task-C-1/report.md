# Task-C-1 — revisão independente (Phase 6)

## NEEDS_FIXES

### Findings

1. **[P1] Cookie `ui_theme` malformado interrompe o pre-paint em vez de ser normalizado** — `apps/ui/src/routes/__root.tsx:15`

   O contrato exige normalizar um valor ausente **ou inválido** antes da
   hidratação. `decodeURIComponent(c[1])` lança para escapes percentuais
   inválidos (por exemplo, `ui_theme=%E0%A4`), interrompendo o IIFE antes de
   escolher o tema, escrever o cookie canônico e aplicar a classe no HTML.
   Como os únicos valores aceitos são ASCII (`light` e `dark`), compare o
   valor codificado diretamente ou proteja a decodificação e trate a exceção
   como valor inválido. Acrescente a regressão para o cookie malformado.

2. **[P1] A suíte não verifica o HTML SSR nem a fronteira do slot do shell** — `apps/ui/src/routes/-__root.test.tsx:32-41`, `apps/ui/src/routes/-_protected.test.ts:63-108`

   O teste do root só chama `Route.options.loader`; ele não renderiza o
   documento e portanto não demonstra que `RootDocument` aplica a preferência
   ao atributo `class` de `<html>` na resposta SSR. O teste protegido só chama
   `beforeLoad` e testa o helper de projeção isoladamente: não prova que
   `AppShell` recebe/renderiza o `AccountMenu` pelo slot tipado, nem que esse
   caminho não obtém sessão no cliente. Isso deixa descobertos critérios
   explícitos de SSR e fronteira client/server. Cubra a renderização/contrato
   do documento e uma montagem autenticada do layout com o slot; mantenha a
   asserção de redirect antes da montagem para o caso anônimo.

### Scope and boundary review

- A projeção em `apps/ui/src/server/auth/get-session.functions.ts:13-33,57-81`
  limita a saída do shell a `id`, `name`, `email` e `role`; não há alteração
  observável de schema, persistência de sessão ou regra de autorização.
- `apps/ui/src/components/app-shell/app-shell.tsx:8-26,45` aceita o menu como
  `ReactNode` tipado e não acessa sessão no componente client-side.
- A guarda em `apps/ui/src/routes/_protected.tsx:17-32` mantém o redirect para
  `/login` com `returnTo` antes de renderizar `AppShell`; o componente de 404
  do root permanece definido em `apps/ui/src/routes/__root.tsx:26-50`.
- O estado do drawer móvel segue local em
  `apps/ui/src/components/app-shell/app-shell.tsx:27-28,66-102`; os callbacks
  de preferências só atualizam o estado após sucesso em
  `apps/ui/src/routes/_protected.tsx:62-80`.

### Test-review note

O report existente declara “2 arquivos, 7 testes”, mas os dois testes de rota
declarados contêm seis casos Vitest efetivos: três em
`-__root.test.tsx` (incluindo os dois casos parametrizados) e três em
`-_protected.test.ts`. A evidência TDD deve ser corrigida junto aos testes.

### Review scope

Inspeção read-only dos arquivos declarados no Task-C-1 e de seus testes de
rota. Nenhum comando Git ou teste foi executado nesta revisão.

## P1 fixes and verification (2026-07-13)

Both P1 findings are resolved within Task-C-1 scope:

- The source-controlled pre-paint IIFE now validates the raw `ui_theme` cookie
  value against the only two canonical ASCII values. It never calls
  `decodeURIComponent`, so malformed percent escapes are treated as invalid,
  normalized to the system fallback, and cannot interrupt class application.
  `-__root.test.tsx` covers `ui_theme=%E0%A4` and asserts the script does not
  throw, applies `light`, and overwrites only `ui_theme`.
- `-__root.ssr.test.tsx` builds a real route tree and uses
  `renderToStaticMarkup(<RouterProvider ...>)` to assert the SSR response
  contains `<html class="dark" lang="en">`. `-_protected.test.ts` mounts the
  real protected layout in a typed route tree with a non-document root for
  jsdom, verifies the `AccountMenu` contents render through `AppShell`, and
  confirms exactly one `getSession` call from the route guard (no extra
  client-shell session lookup). The anonymous redirect test remains in place.

Correction to the prior TDD evidence: it must not state “2 files, 7 tests”.
The current focused command covers **3 route/document test files and 10 Vitest
tests** (the parameterized pre-paint cases are reported individually by
Vitest).

Verification passed:

```text
pnpm --dir apps/ui exec vitest run src/routes/-__root.test.tsx src/routes/-__root.ssr.test.tsx src/routes/-_protected.test.ts
# 3 files passed, 10 tests passed

pnpm --dir apps/ui typecheck
# exit 0

pnpm --dir apps/ui exec biome check src/routes/__root.tsx src/routes/-__root.test.tsx src/routes/-__root.ssr.test.tsx src/routes/-_protected.test.ts
# exit 0

git diff --check
# exit 0
```
