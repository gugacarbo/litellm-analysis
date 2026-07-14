# Process: super-planning

> Fase 1 — BRAINSTORM. Fonte: `$super-planning` em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.
> Decisões para a Etapa 2 da SPEC-0001: modelos, providers e roteamento.

## Problema e objetivo

O `apps/web` administra modelos, providers, credenciais, aliases e
sincronização por meio de rotas HTTP do `apps/server`. Esses fluxos misturam
contratos legados, identidades ambíguas por nome, múltiplas fontes de provider
padrão e operações de compatibilidade sem efeito observável.

O objetivo da Etapa 2 é recriar as superfícies administrativas no `apps/ui`,
usando server functions autenticadas, PostgreSQL como fonte de verdade e
contratos provider-scoped, sem transportar o `api-client` ou as rotas
administrativas legadas.

## Escopo aprovado

- Rotas protegidas para modelos configurados, providers, aliases e settings de
  um modelo identificado por UUID.
- Listagem, criação, edição, ativação, desativação e exclusão de modelos.
- CRUD de providers, rotação e remoção explícita de credenciais cifradas.
- Provider padrão único.
- Aliases manuais de roteamento, inclusive colisões, rename e bloqueios.
- Discovery de providers compatíveis, diff e registro/atualização seletiva
  no registry PostgreSQL.
- Probe administrativo de modelo com prompt curto, timeout, resposta limitada
  e erros sanitizados, sem histórico de chat.
- Estados explícitos de loading, vazio, erro, conflito, expiração e sucesso.
- Acesso somente leitura para `viewer`; mutações exclusivas de `admin`.

## Não objetivos

- Dashboard, analytics, logs e detalhes analíticos de modelo, reservados para
  a Etapa 3.
- Health checks, latência e atualizações contínuas, reservados para a Etapa 4.
- Benchmarks, agentes, roteamento de agentes e chat, reservados para a Etapa 5.
- Portar o cliente HTTP de `apps/web` ou consumir rotas administrativas do
  `apps/server`.
- Preservar `export-configs`, config-vs-registry, merge, add-to-config ou sync
  de default settings legados.
- Implementar OAuth de qualquer provider nesta etapa.
- Inicializar ou incorporar o gateway Hebo no runtime do TanStack Start.

## Decisões de arquitetura

1. A Etapa 2 seguirá fundação canônica seguida de implementação vertical. Antes
   das telas, corrigirá Query SSR, boundary guard, redaction, contratos de erro
   e a façade server-only do domínio. O cutover é limpo: o banco pode ser
   resetado e não haverá migração, fallback, leitura ou suporte a dados legados.
2. `@lite-llm/database` e `llm-config-service` serão a fonte canônica. A
   coordenação hoje presa aos adapters Express será extraída para casos de uso
   transport-agnostic, consumidos por server functions.
3. `model_proxy_models.id` será a identidade administrativa em server
   functions, rotas de detalhe, query keys e mutações. O par
   `(providerId, modelId)` permanecerá como índice único de domínio e como
   identidade legível exibida pela UI.
4. Novos modelos exigem `providerId`; operações por bare `modelName` não fazem
   parte do contrato novo.
5. `model_proxy_providers.is_default` será a única fonte do provider padrão,
   protegida no banco para permitir no máximo um registro default. O parâmetro
   `defaultProvider` do contrato de modelo e a chave concorrente
   `model_proxy_settings.default_provider` serão removidos, sem dual-write.
   Todos os consumidores em `apps/server`, `packages/server`,
   `services/llm-gateway` e `apps/ui` migram na mesma release para
   `is_default`; zero providers default é um estado válido.
6. Excluir um provider referenciado por modelos retorna `CONFLICT`, com a
   contagem de dependências. Não existe cascade, `SET NULL` ou reatribuição
   implícita.
7. API keys, access tokens e refresh tokens de providers são cifrados no
   PostgreSQL conforme ADR-0007. O plaintext só existe transitoriamente no
   comando autenticado ou no ponto estrito de uso upstream; reads nunca
   retornam plaintext ou ciphertext.
8. Criar/substituir segredo aceita plaintext server-side e cifra antes do
   write; omissão preserva; remoção exige intenção explícita. Logs, traces,
   métricas, caches, loaders e erros nunca recebem material sensível.
9. Saves que combinam modelo, roteamento e aliases são transacionais. O modelo
   possui `revision` para o save do aggregate; cada alias possui revision
   própria para mutações individuais. Updates condicionais retornam `CONFLICT`
   quando a revisão enviada está obsoleta e nunca sobrescrevem silenciosamente.
10. Sincronização significa provider para registry: discovery server-side,
    diff visível e aplicação seletiva e idempotente no PostgreSQL. Não existe
    segunda configuração para sincronizar ou exportar.
11. O probe de modelo pertence à validação do provider nesta etapa, mas não
    ao produto de chat. Aceita prompt de até 1.024 caracteres Unicode, retorna
    no máximo 8 KiB e usa timeout de conexão de 3 segundos, timeout total de
    15 segundos e os mesmos controles de destino do discovery.
12. Toda server function exige sessão antes de acessar serviços. Leituras
    aceitam `admin` e `viewer`; criações, updates, deletes, sync e probe exigem
    `admin`.
13. Loaders carregam somente o mínimo de entrada da rota. TanStack Query usa
    query keys estáveis por UUID/provider, cache isolado por request SSR e
    invalidação determinística após mutações.
14. Inputs e outputs de server functions usam schemas Zod explícitos e DTOs
    públicos derivados dos tipos Drizzle. Records internos com segredos não
    atravessam a fronteira da UI.
15. O envelope de erro distinguirá autenticação, autorização, validação,
    not found, conflito, destino bloqueado, indisponibilidade upstream, timeout
    e erro interno sanitizado.

## Compatibilidade e restrições

- Preservar `apps/web` como referência e rollback até a paridade da etapa.
- Não importar services, database, secrets, Node built-ins ou helpers
  server-only na árvore client-side.
- Corrigir `scripts/code-checks/check-ui-client-boundary.ts` para cobrir a
  estrutura atual em `src/features` e `src/shared`, imports de domínio e
  chamadas à API administrativa legada.
- Criar QueryClient por instância/request e integrar a hidratação SSR antes de
  cachear dados administrativos.
- Discovery e probe aceitam HTTPS público sem redirects, userinfo ou IP literal.
  Antes da conexão, DNS deve excluir loopback, link-local, multicast,
  reservado e faixas privadas IPv4/IPv6. Origens HTTPS on-premise e portas fora
  de 443 exigem presença exata em `PROVIDER_DESTINATION_ALLOWLIST`, configuração
  server-side que a UI não pode editar. Discovery limita conexão a 3 segundos,
  duração a 15 segundos, corpo a 1 MiB e lista a 2.000 modelos.
- Usar React Hook Form, Zod e componentes shadcn/ui nos formulários.

## Riscos e mitigações

| Risco                                            | Mitigação                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Mesmo `modelId` em providers diferentes          | UUID administrativo e índice único `(providerId, modelId)`.          |
| Lost update entre abas                           | `revision` obrigatória e update condicional transacional.            |
| Save parcial entre modelo e aliases              | Uma operação de aggregate dentro de transação.                       |
| Provider removido deixa modelo sem rota          | FK restritiva e erro `CONFLICT` com dependências.                    |
| Vazamento de credencial                          | DTO público, redaction, decrypt pontual e testes negativos.          |
| SSR compartilha cache administrativo             | QueryClient por request e hidratação oficial.                        |
| Discovery/probe permite SSRF ou vaza erro remoto | Allowlist de protocolo, validação de destino, timeout e sanitização. |
| Dados legados contaminam o contrato novo         | Reset limpo do banco; nenhum fallback ou migração é permitido.       |

## Suposições para a Fase 2

- A spec derivada receberá o próximo número sequencial disponível em
  `docs/specs/` e referenciará SPEC-0001 e ADRs 0001–0007.
- A paridade exigida é de comportamento útil, não de bugs, strings legadas ou
  controles sem efeito do `apps/web`.
- A rota de settings usa UUID; provider e `modelId` podem mudar sem alterar a
  identidade administrativa.
- A UI nunca recebe segredo previamente salvo; edição exibe apenas o estado
  `hasStoredSecret` e comandos explícitos de substituir ou remover.
- OAuth não faz parte desta etapa; nenhum token OAuth é persistido, exposto ou
  usado em discovery, sync ou probe.
- A revisão humana comparará as quatro superfícies com o `apps/web`, aceitando
  as divergências documentadas nesta decisão.

## Handoff

- visualCompanionUsed: false
- Direção validada pelo usuário em 13 de julho de 2026.
- TDD obrigatório para mudanças de comportamento, com evidência RED/GREEN e
  orientação de `docs/context/testing-anti-patterns.md`.
- Pronto para Fase 2 — SPEC-0005.
