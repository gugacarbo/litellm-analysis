# Process: super-planning

> Fase 1 — BRAINSTORM. Fonte: `$super-planning` em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.
> Decisões para a SPEC-0006: segredos de aplicação cifrados.

## Problema e objetivo

Os sincronizadores de benchmarks de Artificial Analysis e OpenRouter recebem
credenciais de variáveis de ambiente no bootstrap do `apps/server`. O objetivo
é tornar o PostgreSQL a única fonte de verdade dessas duas chaves, cifrando-as
com `APP_ENCRYPTION_KEY` e disponibilizando gestão no painel administrativo.

## Escopo aprovado

- Criar `application_secrets_store`, com chave lógica única, envelope
  cifrado e timestamps.
- Suportar exclusivamente `artificial_analysis_api_key` e
  `openrouter_api_key`.
- Reutilizar o envelope AES-256-GCM versionado já usado por credenciais de
  providers, derivado de `APP_ENCRYPTION_KEY`.
- Adicionar `/models/secrets` no `apps/ui`; apenas `admin` pode listar status,
  salvar, substituir ou remover valores.
- Resolver as credenciais no banco no momento de cada sincronização.
- Remover `ARTIFICIAL_ANALYSIS_API_KEY` e `OPENROUTER_API_KEY` do contrato de
  runtime, sem bootstrap, migração ou fallback por ambiente.
- Usar TDD para todo comportamento novo ou alterado.

## Não objetivos

- Rotação ou múltiplas versões de `APP_ENCRYPTION_KEY`.
- Credenciais de providers de modelo, API keys locais do proxy ou segredos
  arbitrários.
- Histórico, exportação, exibição parcial, auditoria ou logs de valores.

## Decisões de arquitetura

1. A tabela usa o prefixo operacional `model_proxy_`; é configuração de
   runtime, não um artefato da UI.
2. A coluna `key` é única e a camada de domínio aceita somente os dois
   identificadores aprovados.
3. Apenas o envelope `enc:v1:` é persistido; a chave de criptografia nunca é
   persistida.
4. Um serviço dedicado cifra e recupera valores. DTOs públicos expõem somente
   `key`, `isConfigured`, `createdAt` e `updatedAt`.
5. A UI compartilha a fronteira autenticada do painel de modelos, mas até a
   listagem de status exige `admin`.
6. O sync resolve o valor no início de cada execução; substituições afetam o
   próximo disparo, sem restart.
7. Registro ausente ou envelope ilegível falha fechado. Os códigos públicos
   legados `*_API_KEY_MISSING` permanecem por compatibilidade, sem preservar
   leitura de variável ou fallback.

## Alternativas rejeitadas

| Alternativa                        | Motivo                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Fallback permanente para `.env`    | Mantém duas fontes de verdade e divergência silenciosa.                    |
| Bootstrap único por ambiente       | Não foi a direção escolhida e mantém segredo fora do fluxo administrativo. |
| Reutilizar `model_proxy_providers` | Mistura credenciais upstream de modelos e sincronizadores internos.        |
| Retornar valor uma vez após salvar | Amplia superfície de vazamento sem necessidade operacional.                |

## Riscos assumidos

- Sync fica indisponível até um administrador cadastrar a chave; é estado
  explícito e esperado.
- Deploys devem remover as duas variáveis sem remover `APP_ENCRYPTION_KEY`.
- Áreas de schema e `model-admin` já têm trabalho em andamento da SPEC-0005;
  tarefas futuras precisam preservar as alterações existentes e ser sequenciais.

## Handoff para a spec

- `visualCompanionUsed: false`.
- A spec exige TDD e referencia `docs/context/testing-anti-patterns.md`.
