---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

> ⚠️ **VERDADE ATUAL:** Credenciais upstream novas usam `secretRef` (nome de env var) e nunca persistem segredo bruto. O campo `apiKey` é rejeitado no service layer para writes novos. A resolução em runtime segue a ordem: `readSecretRef` → `credential.apiKey` (legado) → provider row → `MODEL_PROXY_UPSTREAM_API_KEY`.

# Usar `secretRef` em vez de segredo bruto para credenciais upstream

## Contexto e problema

O sistema precisa armazenar credenciais de provedores upstream (ex. `OPENAI_API_KEY`) para roteamento de modelos. O schema legado (`LiteLLM_CredentialsTable`) persiste a chave bruta em uma coluna `api_key`, o que é indesejável por segurança. É necessário um mecanismo que nunca armazene o valor do segredo, apenas uma referência indireta.

## Direcionadores da decisão

- Segurança: não expor segredos em payloads HTTP, logs, ou backups do banco de dados.
- Compatibilidade com dados legados importados do LiteLLM.
- Simplicidade operacional: usar variáveis de ambiente já é o padrão para configuração de provedores.
- Credenciais upstream não devem vazar para artefatos de configuração gerados (OpenCode, VS Code, OpenAgent).

## Opções consideradas

### Opção 1 — `secretRef` com nome de env var (escolhida)
**Prós:** Segredo nunca persiste no DB; compatível com 12-factor app; resolução trivial via `process.env`; fácil de auditar.
**Contras:** Requer que o operador gerencie env vars externamente; não criptografa em repouso (mas não há segredo para criptografar).

### Opção 2 — Criptografar `apiKey` no DB
**Prós:** Mantém o valor no banco de forma ofuscada.
**Contras:** Complexidade de gerenciamento de chave de criptografia; ataque no runtime ainda expõe o segredo; falso senso de segurança.

### Opção 3 — Usar um cofre de segredos (Vault, AWS Secrets Manager)
**Prós:** Máxima segurança; rotação centralizada.
**Contras:** Overhead operacional para o escopo atual; dependência externa; não justificado para o estágio do projeto.

## Decisão

Adotar `secretRef` (coluna `secret_ref`) como campo canônico de escrita para credenciais upstream. O campo contém apenas o nome exato de uma variável de ambiente (ex. `OPENAI_API_KEY`), nunca o valor da chave. Writes novos no campo `apiKey` são rejeitados no service layer. Dados legados com `api_key` bruto são lidos por adapters de import que convertem para `secretRef` quando possível ou marcam para rotação manual.

## Consequências

- Positivas: Segredos nunca persistem no DB; compatível com 12-factor app; resolução trivial.
- Negativas: Dados legados com `api_key` bruto precisam de migração manual ou adapters temporários.
- Proibido: Escrever `apiKey` em novos registros; expor credenciais upstream em artefatos OpenCode/VS Code/OpenAgent.

## Confirmação

```bash
# Verificar se não há writes de apiKey no service layer
grep -rn "apiKey" packages/server/src/services/credentials/ | grep -v "legacy\|import\|adapter" && exit 1
# Verificar que secret_ref não usa prefixo env:
grep -rn "env:" repositories/model-proxy-repository/prisma/ && exit 1
```

## Notas

A resolução em runtime segue a ordem já implementada em `upstream-provider.ts`: (1) `readSecretRef(row.secretRef)`, (2) `credential.apiKey` (legado), (3) provider row / env fallback, (4) `MODEL_PROXY_UPSTREAM_API_KEY` (fallback global de dev). O formato de `secretRef` é o nome exato da env var, sem prefixo `env:`.
