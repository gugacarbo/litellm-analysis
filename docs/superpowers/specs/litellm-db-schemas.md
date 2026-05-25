# Resumo para outra LLM: banco de dados do LiteLLM em modo Docker

## Objetivo desta investigação
Mapear, com o máximo de segurança possível, **quais tabelas e colunas o LiteLLM usa no modo Docker**, e identificar **onde o schema real está definido**.

## Conclusão principal
A conclusão mais segura é:

- o **LiteLLM Proxy**, em modo Docker, usa tipicamente **PostgreSQL**
- o gerenciamento de schema/migrations é feito com **Prisma / Prisma Migrate**
- a documentação ajuda a entender o deploy e as migrations, mas a **fonte de verdade das tabelas e colunas é o código/schema do repositório**
- existe evidência forte de que o schema do banco está em um arquivo **`schema.prisma`** ligado ao proxy, referenciado como:
  - `litellm/proxy/schema.prisma`
  - e também apareceu referência a um raw schema em `refs/heads/main/schema.prisma`
- a tabela **`_prisma_migrations`** existe/é esperada, pois o LiteLLM usa Prisma Migrate

## O que foi confirmado com melhor confiança

### Banco usado no modo Docker
Evidências encontradas indicam:

- **PostgreSQL** como banco do proxy
- uso do schema padrão **`public`** em exemplos/logs
- uso de **Prisma Migrate** para controlar estrutura e upgrades

### Indícios concretos observados
Foram encontrados resultados/trechos apontando explicitamente para algo como:

- `Datasource "client": PostgreSQL database "litellm", schema "public"`

Também apareceram referências a:

- histórico de migration armazenado em:
  - **`_prisma_migrations`**
- dezenas de migrations no projeto:
  - houve menção a algo como **“50 migrations found in prisma/migrations”**

## Onde procurar a fonte de verdade
A outra LLM deve priorizar:

1. **arquivo de schema Prisma**
   - `litellm/proxy/schema.prisma`
   - ou equivalente na branch/tag exata usada pela imagem Docker

2. **pasta de migrations**
   - `prisma/migrations` ou equivalente no repositório/imagem

3. **banco em execução**
   - consultar `information_schema.tables`
   - consultar `information_schema.columns`
   - consultar `pg_indexes`

## O que foi encontrado sobre entidades/tabelas
Não foi possível extrair o schema completo linha a linha, então a lista abaixo deve ser tratada assim:

- **confirmadas/fortemente sugeridas**
  - `_prisma_migrations`
  - entidades de **budget**
  - entidades de **organization**
  - entidades de **project**
  - entidades de **users**
  - entidades de **teams**
  - entidades de **verification token / auth token**
  - entidades ligadas a **spend tracking**

### Nomes observados ou fortemente sugeridos
Nos resultados apareceram referências textuais a nomes como:

- `LiteLLM_OrganizationTable`
- `LiteLLM_ProjectTable`
- `LiteLLM_VerificationToken`

Esses nomes parecem ser nomes de modelos Prisma/tabelas mapeadas ou classes relacionadas ao schema do proxy.

## Colunas observadas explicitamente
As colunas abaixo apareceram em snippet ligado ao schema:

- `budget_id`
- `allowed_models`

Também apareceu contexto indicando que:

- `allowed_models` parece ser um array/lista de modelos permitidos
- `budget_id` participa de relações com organization/project

## Inferência estrutural plausível
Com base nos snippets, é plausível que exista uma entidade de orçamento/budget com:

- chave tipo `budget_id`
- campo `allowed_models`
- relações com:
  - `LiteLLM_OrganizationTable`
  - `LiteLLM_ProjectTable`

Mas **não afirmar outras colunas além dessas sem abrir o schema completo**.

## Limitações importantes
A investigação **não conseguiu abrir e transcrever o `schema.prisma` completo** diretamente. Portanto:

- **não há inventário completo e validado de todas as tabelas**
- **não há dicionário completo tabela → colunas**
- **não se deve inventar nomes de colunas adicionais**
- a resposta final deve deixar claro o que é:
  - confirmado
  - altamente provável
  - apenas inferido

## Como outra LLM deve continuar
Se for continuar a investigação, o próximo passo ideal é:

1. abrir o arquivo bruto:
   - `litellm/proxy/schema.prisma`
2. enumerar:
   - todos os `model`
   - todos os campos de cada `model`
   - tipos
   - `@id`
   - `@default`
   - `@map`
   - `@@map`
   - `@@index`
   - relações
3. depois cruzar com:
   - migrations SQL
   - schema real do banco em execução

## Instrução de segurança para a próxima LLM
Ao responder, separar explicitamente em:

- **Confirmado**
- **Forte evidência**
- **Inferência**
- **Não confirmado**

E evitar afirmar um schema completo sem leitura direta do `schema.prisma` ou introspecção do PostgreSQL.

## Resumo executivo curto
- LiteLLM em modo Docker/proxy usa **PostgreSQL + Prisma Migrate**
- o schema real está no **`schema.prisma`** do projeto, muito provavelmente em **`litellm/proxy/schema.prisma`**
- a tabela **`_prisma_migrations`** é esperada e confirmada conceitualmente
- foram observadas referências a entidades/tabelas ligadas a:
  - budgets
  - organizations
  - projects
  - users
  - teams
  - verification tokens
  - spend tracking
- colunas explicitamente vistas:
  - `budget_id`
  - `allowed_models`
- ainda **não há lista completa e confiável de todas as colunas** sem abrir o schema completo ou introspectar o banco

Se quiser, eu também posso transformar isso em:
- **arquivo `.md` exportável**
- **prompt pronto para outra LLM continuar a investigação**
- **checklist SQL para introspecção do Postgres do LiteLLM**
