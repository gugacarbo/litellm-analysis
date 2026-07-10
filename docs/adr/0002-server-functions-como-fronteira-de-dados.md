---
status: proposed
date: 2026-07-09
builds-on: [ADR-0001]
superseded-by: null
deciders: ["produto", "engenharia"]
---

# O apps/ui possui sua própria fronteira de dados

## Contexto e problema

O `apps/web` atual acessa dados administrativos pela API HTTP do `apps/server`. A nova aplicação precisa controlar sua própria fronteira de dados, podendo expor APIs REST em `apps/ui/src/routes/api` e server functions TanStack Start sem depender das rotas administrativas legadas.

## Direcionadores da decisão

- Nenhum consumo da API administrativa existente em `apps/server` pelo `apps/ui`.
- APIs REST próprias em `apps/ui/src/routes/api` são permitidas quando fizerem parte do contrato da nova aplicação.
- Segredos e credenciais devem permanecer no runtime server-side.
- Regras de negócio existentes devem ser reutilizadas.
- A fronteira deve suportar server functions e rotas REST próprias com autenticação, validação e autorização.

## Opções consideradas

### Opção 1 — Server functions e APIs REST próprias no apps/ui

**Prós:** mantém a execução sensível no servidor, permite contratos REST próprios e elimina a dependência da API administrativa legada.
**Contras:** exige manter dois estilos de contrato e aplicar a mesma política de autenticação nos dois.

### Opção 2 — UI consumir a API REST existente

**Prós:** reutiliza contratos e rotas atuais.
**Contras:** mantém a arquitetura que será aposentada e cria dependência interna do `apps/server`.

### Opção 3 — Browser acessar banco ou provedores

**Prós:** reduz código server-side imediato.
**Contras:** expõe credenciais, quebra o modelo de segurança e não é aceitável para este sistema.

## Decisão

O `apps/ui` será dono de sua fronteira de dados. Server functions serão o caminho padrão para operações internas da própria aplicação, e rotas REST em `apps/ui/src/routes/api` serão permitidas para contratos que precisem de HTTP explícito. Nenhum código do `apps/ui` poderá consumir as rotas administrativas existentes em `apps/server`. Componentes e hooks client-side nunca acessarão banco, credenciais ou providers diretamente.

## Consequências

- Server functions e rotas REST próprias precisarão validar sessão e autorização antes de executar operações.
- A árvore client-side deve ser protegida contra imports server-only.
- TanStack Query poderá consumir server functions ou APIs REST próprias conforme o contrato da feature; a escolha deve ser explícita na spec derivada.
- Chamadas a provedores, OAuth e streaming serão iniciadas no runtime server-side.
- APIs REST próprias devem usar o envelope de erros e os validators do `apps/ui`.
- A comunicação com a API administrativa legada do `apps/server` é proibida.

## Confirmação

```bash
if rg -n "localhost:3008|apps/server|/providers|/analytics|/models" apps/ui/src; then exit 1; fi
if rg -n "cloudflare:workers|node:|database|provider-secrets" apps/ui/src --glob '*.tsx' --glob '*.ts' | rg -v 'server|functions'; then exit 1; fi
```

## Notas

A implementação deve separar explicitamente módulos client-safe de módulos server-only, documentar cada rota REST própria e adicionar testes para impedir consumo da API legada ou regressões de bundling.
