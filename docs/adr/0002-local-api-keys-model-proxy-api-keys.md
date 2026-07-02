---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ **VERDADE ATUAL:** Chaves locais de API do proxy (`Authorization: Bearer …`) são armazenadas em `model_proxy_api_keys` com hash argon2id/bcrypt. O plaintext é retornado apenas uma vez na criação. Bootstrap via `MODEL_PROXY_API_KEY` env var é aceito quando a tabela está vazia (dev). O runtime atual (model-proxy-routes.ts) ainda só valida contra env var; a validação contra DB será implementada na Onda 3 (SA-3D).

# Armazenar chaves locais do proxy com hash em `model_proxy_api_keys`

## Contexto e problema

Clientes que chamam o proxy local usam `Authorization: Bearer <chave>`. Essas chaves são distintas das credenciais upstream e precisam ser validadas em runtime. O schema legado não tinha uma tabela dedicada para isso — usava apenas a env var `MODEL_PROXY_API_KEY`. É necessário um mecanismo que permita múltiplas chaves, com rotação individual e sem armazenar plaintext.

## Direcionadores da decisão

- Segurança: nunca armazenar plaintext de chaves de API no banco de dados.
- Suporte a múltiplas chaves ativas simultaneamente (diferentes clientes/ambientes).
- Bootstrap simples para desenvolvimento sem exigir DB seed.
- Rastreabilidade: registrar `lastUsedAt` para auditoria de uso.

## Opções consideradas

### Opção 1 — Hash argon2id/bcrypt em `model_proxy_api_keys` (escolhida)
**Prós:** Seguro; suporte a múltiplas chaves; `lastUsedAt` para auditoria; bootstrap via env var quando tabela vazia.
**Contras:** Custo computacional do hash na validação (aceitável para autenticação de proxy).

### Opção 2 — Plaintext em tabela dedicada
**Prós:** Simples; validação trivial.
**Contras:** Inseguro; qualquer vazamento do DB expõe todas as chaves.

### Opção 3 — JWT ou token assinado
**Prós:** Sem armazenamento de hash; autovalidação.
**Contras:** Complexidade de rotação; dificuldade de revogação individual sem blacklist.

## Decisão

Persistir chaves locais em `model_proxy_api_keys` com hash **argon2id** (preferido) ou **bcrypt** com cost ≥ 10. O plaintext é retornado ao usuário apenas uma vez na resposta HTTP de criação. A validação em runtime compara o hash contra a chave fornecida. A env var `MODEL_PROXY_API_KEY` serve como bootstrap: se definida e a tabela estiver vazia, a autenticação aceita a env var sem exigir linha no DB.

## Consequências

- Positivas: Múltiplas chaves com segurança; auditoria via `lastUsedAt`; bootstrap simples.
- Negativas: Custo computacional do hash; necessidade de migrar de env-only para DB na Onda 3.
- Obrigatório: Algoritmo de hash forte (argon2id ou bcrypt cost ≥ 10).
- Proibido: Armazenar plaintext em qualquer coluna.

## Confirmação

```bash
# Verificar que keyHash é único no schema
grep -A5 "keyHash" repositories/model-proxy-repository/prisma/schema.prisma | grep "unique" || exit 1
# Verificar que não há plaintext sendo logado
grep -rn "apiKey\|plaintext" packages/server/src/routes/model-proxy-routes.ts | grep -i "log\|console" && exit 1
```

## Notas

Ordem de autenticação futura (Onda 3): (1) DB (`keyHash` match + `enabled`) → atualiza `lastUsedAt`; (2) fallback `process.env.MODEL_PROXY_API_KEY`. Comportamento atual (`model-proxy-routes.ts`) só valida contra env var; esta decisão não altera o runtime até a implementação da Onda 3 (SA-3D).
