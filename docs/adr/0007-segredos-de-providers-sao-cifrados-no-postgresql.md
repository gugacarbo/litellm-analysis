---
status: accepted
date: 2026-07-13
builds-on: [ADR-0002, ADR-0003, ADR-0006]
superseded-by: null
deciders: ["produto", "engenharia"]
---

> **Process: super-planning** — Fase 1 — BRAINSTORM. Fonte:
> `$super-planning` em
> `/home/gustavo/.agents/skills/super-planning/phases/01-brainstorm.md`.

# O sistema cifra segredos de providers no PostgreSQL

## Contexto e problema

Providers upstream precisam de API keys, access tokens e refresh tokens para
autenticar chamadas, descobrir modelos e renovar sessões OAuth. O estado atual
já possui armazenamento cifrado com `APP_ENCRYPTION_KEY`, mas
`docs/context/CONVENTIONS.md` ainda declara `secretRef` como campo canônico e
manda rejeitar writes em `apiKey`. Essa divergência deixa incerto se o segredo
deve viver no ambiente ou no PostgreSQL e não define o ciclo de vida seguro de
criação, edição, remoção, rotação e falha de descriptografia.

Esta decisão trata somente de credenciais de providers upstream. API keys
locais usadas por clientes para autenticar no proxy continuam sendo segredos
não recuperáveis, persistidos apenas como hash conforme a convenção própria.

## Direcionadores da decisão

- O PostgreSQL é a fonte de verdade da configuração operacional.
- Administradores precisam cadastrar e rotacionar credenciais pela aplicação.
- O browser e as APIs de leitura nunca devem recuperar um segredo salvo.
- O gateway precisa obter o plaintext apenas no instante de autenticar uma
  operação upstream.
- Backups, réplicas, logs e erros não podem transformar acesso operacional em
  acesso direto às credenciais.
- Rotação da chave de criptografia e corrupção de ciphertext devem falhar de
  forma explícita e segura.

## Opções consideradas

### Opção 1 — Cifrar os segredos no PostgreSQL

**Prós:** mantém a configuração na fonte de verdade do sistema, permite gestão
administrativa e OAuth, e reduz a exposição do plaintext ao ponto de uso.
**Contras:** exige gestão de chaves de criptografia, rotação, migração de dados
legados e disciplina rigorosa de redaction.

### Opção 2 — Persistir somente referências a variáveis de ambiente

**Prós:** não armazena o segredo no banco e simplifica o formato da linha.
**Contras:** divide a fonte de verdade, impede gestão completa pela aplicação e
torna rotação e deploy dependentes do ambiente de cada runtime.

### Opção 3 — Delegar os segredos a um cofre externo

**Prós:** oferece políticas e auditoria especializadas para credenciais.
**Contras:** adiciona infraestrutura e disponibilidade externa que não fazem
parte da arquitetura atual.

## Decisão

API keys, access tokens, refresh tokens e demais segredos de providers serão
armazenados no PostgreSQL usando criptografia autenticada. A chave raiz não
será persistida no banco e deverá ser fornecida ao runtime por configuração
segura. O envelope cifrado será versionado e identificará a chave de
criptografia usada, permitindo rotação sem interpretar ciphertext como
plaintext.

O plaintext poderá existir apenas no runtime server-side e pelo menor intervalo
necessário para uma operação que efetivamente o use: autenticação de chamada
upstream, descoberta autenticada, troca ou renovação OAuth. A descriptografia
não fará parte de DTOs gerais de provider, queries administrativas, loaders,
cache client-side ou respostas públicas.

`secretRef` deixa de ser o contrato canônico e não será aceito em novos writes.
Registros legados baseados em `secretRef` deverão passar por migração controlada
para um segredo cifrado no PostgreSQL; depois do cutover, o runtime operacional
não poderá usar variável de ambiente, plaintext legado ou outro fallback
silencioso quando a leitura do envelope falhar. Entradas de criação ou troca
como `apiKey` e tokens são permitidas apenas na fronteira autenticada
server-side e são cifradas antes da persistência.

O ciclo de vida terá semântica explícita:

- **Criar:** receber o segredo por canal autenticado, cifrá-lo antes do write e
  retornar somente um indicador como `hasStoredSecret`.
- **Preservar:** omitir o campo de segredo em uma atualização mantém o valor
  cifrado atual sem descriptografá-lo.
- **Substituir:** enviar uma intenção explícita com um novo valor não vazio
  cifra e substitui atomicamente o segredo; o valor anterior nunca é retornado.
- **Remover:** usar uma operação ou flag dedicada limpa o envelope; string vazia
  não significa remoção. O provider passa ao estado sem credencial e operações
  que a exigem falham de forma explícita. Desconectar OAuth também remove os
  tokens persistidos e tenta revogá-los quando o provider oferecer revogação.

Respostas de leitura exporão somente metadados não sensíveis e indicadores de
presença ou estado. Plaintext, ciphertext, IV, tag, token parcial e fingerprints
derivados do segredo não serão exibidos ao usuário nem emitidos em logs,
traces, métricas, eventos, erros ou artefatos gerados. A redaction acontecerá
antes de qualquer saída, inclusive em falhas do provider.

Rotação manterá, durante uma janela controlada, a chave ativa e as chaves
anteriores necessárias à leitura. Um processo server-side recriptografará cada
envelope com a chave ativa, verificará a cobertura e só então permitirá retirar
a chave anterior. Novos writes sempre usarão a chave ativa. Falha de
autenticação do envelope, versão desconhecida, chave indisponível ou payload
corrompido produzirá erro sanitizado e falhará fechado: o sistema não devolverá,
apagará, sobrescreverá ou tentará usar o valor como plaintext automaticamente.

## Consequências

- `docs/context/CONVENTIONS.md` passa a declarar o segredo cifrado no banco como
  contrato canônico e `secretRef` como legado somente para migração.
- Serviços de provider precisam separar comandos de segredo dos DTOs de leitura
  e modelar preservar, substituir e remover sem ambiguidade.
- A cifra deve ser autenticada e o envelope deve suportar versão e identificação
  da chave; `APP_ENCRYPTION_KEY` permanece fora do PostgreSQL.
- Fluxos OAuth seguem a mesma política de armazenamento, redaction, uso efêmero
  e rotação aplicável às API keys.
- Código legado que aceita plaintext persistido ou fallback por `secretRef`
  precisa ser removido no cutover; a migração não autoriza compatibilidade
  indefinida.
- Perder todas as chaves capazes de abrir um envelope torna o segredo
  irrecuperável; a recuperação operacional será cadastrar uma nova credencial,
  nunca revelar ou adivinhar a anterior.
- API keys locais do proxy não são abrangidas por esta cifra reversível e
  continuam armazenadas como hash.

## Confirmação

```bash
scripts/docs-check
rg -n "hasStoredSecret|encryptProviderSecret|decryptProviderSecret|APP_ENCRYPTION_KEY" services apps packages database
rg -n "secretRef|apiKey|accessToken|refreshToken" apps/ui services/llm-config-service services/llm-gateway --glob '*.ts' --glob '*.tsx'
```

A revisão dos resultados deve confirmar que apenas comandos server-side aceitam
plaintext, que DTOs de leitura retornam indicadores de estado e que cada ponto
de descriptografia corresponde a uso upstream imediato. Testes de integração
devem cobrir criação sem retorno do segredo, preservação por omissão,
substituição, remoção explícita, rotação, envelope corrompido e redaction.

## Notas

Um cofre externo poderá substituir o armazenamento cifrado no PostgreSQL por
uma ADR futura. Até lá, ele não é dependência implícita desta decisão.
