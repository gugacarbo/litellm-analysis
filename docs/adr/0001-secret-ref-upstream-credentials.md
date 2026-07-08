---
status: accepted
date: 2026-06-16
builds-on: []
superseded-by: null
deciders: [architecture-team]
---

# Usar `secretRef` em vez de segredo bruto para credenciais upstream

## Contexto e problema

O sistema precisa armazenar credenciais de provedores upstream (ex. `OPENAI_API_KEY`) para roteamento de modelos. Persistir a chave bruta no banco de dados é indesejável por segurança: qualquer vazamento do DB ou log expõe o segredo.

## Direcionadores da decisão

- Segurança: não expor segredos em payloads HTTP, logs, ou backups do banco.
- Simplicidade operacional: variáveis de ambiente já são o padrão para configuração de provedores.
- Credenciais upstream não devem vazar para artefatos de configuração gerados (OpenCode, VS Code, OpenAgent).

## Opções consideradas

### Opção 1 — `secretRef` com nome de env var (escolhida)
**Prós:** Segredo nunca persiste no DB; compatível com 12-factor app; resolução trivial via `process.env`; fácil de auditar.
**Contras:** Requer que o operador gerencie env vars externamente.

### Opção 2 — Criptografar `apiKey` no DB
**Prós:** Mantém o valor no banco de forma ofuscada.
**Contras:** Complexidade de gerenciamento de chave de criptografia; ataque no runtime ainda expõe o segredo; falso senso de segurança.

### Opção 3 — Cofre de segredos externo (Vault, AWS Secrets Manager)
**Prós:** Máxima segurança; rotação centralizada.
**Contras:** Overhead operacional desproporcional ao escopo; dependência externa.

## Decisão

Adotar `secretRef` (coluna `secret_ref`) como campo canônico para credenciais upstream. O campo contém apenas o **nome exato** de uma variável de ambiente (ex. `OPENAI_API_KEY`), nunca o valor da chave. O formato não usa prefixo `env:` — é o nome literal da env var. Writes no campo `apiKey` são rejeitados no service layer.

## Consequências

- **Positivas:** Segredos nunca persistem no DB; compatível com 12-factor app; resolução trivial.
- **Negativas:** Operador precisa gerenciar env vars externamente.
- **Proibido:** Escrever `apiKey` em novos registros; expor credenciais upstream em artefatos gerados.
- **Resolução em runtime:** `readSecretRef(row.secretRef)` → `credential.apiKey` (legado) → provider row/env fallback.

## Confirmação

```bash
# Nenhum write de apiKey no service layer (exceto adapters legados)
grep -rn "apiKey" packages/server/src/services/credentials/ | grep -v "legacy\|import\|adapter" && exit 1
# secret_ref não usa prefixo env:
grep -rn '"env:' database/src/schema/ && exit 1
```
