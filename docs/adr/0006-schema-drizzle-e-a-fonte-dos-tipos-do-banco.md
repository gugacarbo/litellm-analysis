---
status: proposed
date: 2026-07-09
builds-on: []
superseded-by: null
deciders: ["produto", "engenharia"]
---

# O schema Drizzle é a fonte dos tipos do banco

## Contexto e problema

O monorepo possui schemas de tabelas definidos com Drizzle e múltiplas camadas que precisam consumir os mesmos modelos persistidos. Duplicar interfaces ou schemas Zod em services, repositories ou aplicações permite que tipos de leitura, insert e update divergentes avancem sem que o schema do banco seja atualizado.

## Direcionadores da decisão

- Manter uma única fonte de verdade para modelos persistidos.
- Garantir que tipos de leitura reflitam as colunas reais das tabelas.
- Garantir que contratos de insert e update reflitam o schema Drizzle vigente.
- Evitar drift entre banco, repositories, server functions e UI.
- Preservar DTOs específicos quando eles representam comportamento externo, não linhas do banco.

## Opções consideradas

### Opção 1 — Importar tipos e schemas derivados do database

**Prós:** reduz duplicação, torna migrações explícitas e mantém as camadas alinhadas ao schema real.
**Contras:** exige organizar exports do pacote `database` e adaptar contratos antigos.

### Opção 2 — Cada camada define seus próprios modelos

**Prós:** autonomia local e menor acoplamento imediato.
**Contras:** cria divergência silenciosa entre persistência e contratos de aplicação.

### Opção 3 — Manter interfaces próprias e validar apenas em runtime

**Prós:** flexibilidade para payloads distintos.
**Contras:** não garante alinhamento estático e mantém duplicação para os casos de insert/update.

## Decisão

Interfaces e schemas Zod que representam modelos persistidos no banco devem ser importados ou derivados do schema Drizzle publicado pelo pacote `database`. A regra inclui tipos de seleção, insert e update, além das variantes parciais ou obrigatórias derivadas desses contratos.

Repositories, services, server functions e aplicações não devem redefinir interfaces ou schemas Zod equivalentes às tabelas. Quando uma camada precisar de um DTO diferente por razões de apresentação, transporte ou domínio, ele deve ser explicitamente transformado a partir do tipo do banco e não se apresentar como substituto do schema persistido.

## Consequências

- O pacote `database` deve exportar os schemas Drizzle e os tipos derivados necessários para leitura, insert e update.
- Novos contratos persistidos devem começar pela alteração do schema Drizzle.
- Alterações de coluna exigem revisar consumidores tipados e migração correspondente.
- Schemas Zod de entrada podem existir para validação de payload, mas devem ser derivados ou compostos a partir dos tipos do schema do banco quando representarem a mesma entidade.
- DTOs de UI, server functions e APIs podem ter formato próprio quando houver uma transformação explícita e testada.
- Duplicações existentes devem ser migradas gradualmente, sem bloquear a evolução dos domínios não relacionados.

## Confirmação

```bash
rg -n "interface .*Model|type .*Model|z\.object\(" services repositories apps packages \
  --glob '*.ts' --glob '*.tsx' | rg -v 'database/src/schema|\.test\.'
```

A inspeção deve ser revisada por domínio: cada modelo encontrado deve ser classificado como tipo persistido derivado do `database` ou como DTO legítimo com transformação explícita.

## Notas

Esta ADR não exige que todos os DTOs da aplicação sejam idênticos às linhas do banco. Ela proíbe apenas redefinir como modelo persistido um contrato que já possui fonte no schema Drizzle.
