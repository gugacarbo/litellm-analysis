---
status: proposed
date: 2026-07-09
builds-on: [ADR-0002]
superseded-by: null
deciders: ["produto", "engenharia"]
---

# Better Auth protege a UI com bootstrap por convite

## Contexto e problema

As server functions concentrarão operações administrativas, credenciais e configurações persistidas. O modelo local atual não fornece identidade de usuário suficiente para proteger essa nova fronteira.

## Direcionadores da decisão

- Server functions devem conhecer a sessão e a autorização do usuário.
- O primeiro acesso não pode depender de cadastro público acidental.
- Sessões e usuários devem ser persistidos no banco do sistema.
- O fluxo deve ser compatível com TanStack Start.

## Opções consideradas

### Opção 1 — Better Auth com convite inicial

**Prós:** fornece sessões e integração de autenticação sem criar protocolo próprio, com bootstrap controlado.
**Contras:** exige tabelas, migrações, middleware e testes de sessão.

### Opção 2 — Autenticação posterior

**Prós:** reduz o escopo inicial.
**Contras:** deixaria operações administrativas sem uma fronteira de autorização definida.

### Opção 3 — API key no browser

**Prós:** implementação simples.
**Contras:** não oferece sessão, rotação ou autorização por usuário adequada para a UI administrativa.

## Decisão

A UI usará Better Auth com sessões persistidas. O primeiro usuário será criado por um fluxo de convite ou segredo de configuração inicial; depois disso, o administrador controlará a criação e o acesso dos demais usuários. Toda server function administrativa deverá validar a sessão antes de executar.

## Consequências

- Será necessário adicionar schema e migrações de autenticação.
- A aplicação deverá tratar sessão ausente, expirada e sem permissão.
- Segredos de bootstrap não poderão ser enviados ao client bundle.
- A autorização deverá ser aplicada no servidor, não apenas ocultando controles na UI.
- Fluxos de OAuth de providers continuarão server-side e não serão confundidos com login da aplicação.

## Confirmação

```bash
rg -n "createServerFn|requireSession|auth|session" apps/ui/src --glob '*.ts' --glob '*.tsx'
rg -n "invite|bootstrap|setup" apps/ui/src apps/server/src packages services --glob '*.ts' --glob '*.tsx'
```

## Notas

O provedor de identidade externo, se necessário no futuro, deverá ser tratado em uma ADR que superseda esta decisão ou complemente o fluxo de Better Auth.
