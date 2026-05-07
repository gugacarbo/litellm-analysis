# @lite-llm/agents-manager — Fluxo de Dados

## Visão Geral

Este documento descreve como os dados fluem através do pacote `agents-manager`, desde o armazenamento através de transformações até a geração de configurações para consumidores.

---

## Fluxo de Leitura

### Lendo Configuração (readConfigFile)

```
┌─────────────┐
│   db.json   │
│ (DbConfig)  │
└──────┬──────┘
       │ readDb()
       ▼
┌─────────────┐     ┌─────────────────┐
│   db raw    │────▶│ AgentTransformer │
│  DbConfig   │     │    toOutput()    │
└─────────────┘     └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │CategoryTransformer│
                    │    toOutput()    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  AgentConfigFile │
                    │ (Formato Externo) │
                    └─────────────────┘
```

### Lendo Único Agente

```
┌─────────────┐
│   db.json   │
└──────┬──────┘
       │ readDb()
       ▼
┌─────────────┐
│   db raw    │
│  DbConfig   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│getAgentAdapter()│
│     toApi()     │
└─────────────────┘
```

---

## Fluxo de Escrita

### Atualizando um Agente (updateAgentInDb)

```
┌──────────────────┐
│ { model, temp }  │
│  AgentConfig     │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│getAgentAdapter()│
│      toDb()      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   DbAgentEntry   │
│  { model, temp } │
└──────┬──────────┘
       │ readDb() + merge
       ▼
┌─────────────┐
│   db.json   │
│ (modificado) │
└──────┬──────┘
       │ writeDb()
       ▼
┌─────────────┐
│  Escrita    │
│  (atômica)  │
└─────────────┘
```

### Escrevendo Configuração Completa (writeFullConfig)

```
┌──────────────────────┐
│   AgentConfigFile    │
│ { agents, categories}│
└──────┬───────────────┘
       │
       ▼
┌─────────────────┐
│AgentAdapter.toDb()│
│  (por agente)    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────┐
│CategoryAdapter.toDb()│
│  (por categoria)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│      DbConfig       │
│ (substituição total)│
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│  Escrita    │
│  (atômica)  │
└─────────────┘
```

---

## Fluxo de Geração

### Escrevendo Providers OpenCode (writeProvidersFile)

```
┌─────────────┐
│   db.json   │
│ (DbConfig)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│   ProvidersGenerator.write()     │
├─────────────────────────────────┤
│ 1. Ler db.models                │
│ 2. Mesclar com modelos fornecidos│
│ 3. Construir provider litellm  │
│    - baseURL, apiKey           │
│    - lista de modelos          │
│ 4. Para cada agente/categoria: │
│    - Adicionar entrada npm provider│
│    - Configurar baseURL         │
│    - Listar modelos disponíveis │
└──────────────┬──────────────────┘
               │
               ▼
        ┌─────────────┐
        │opencode.json │
        │   (atômica) │
        └─────────────┘
```

### Escrevendo Modelos VS Code (writeVscodeModelsFile)

```
┌─────────────┐
│   db.json   │
│ (DbConfig)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  VscodeModelsGenerator.write()  │
├─────────────────────────────────┤
│ 1. Ler db.models                │
│ 2. Mesclar com modelos fornecidos│
│ 3. Construir array de modelos VS Code:│
│    - id, label, provider        │
│    - contextLength, maxTokens  │
│    - custo input/output         │
│ 4. Remover /v1 do baseUrl      │
└──────────────┬──────────────────┘
               │
               ▼
        ┌─────────────────────┐
        │vscode-oaicopilot.json │
        │       (atômica)       │
        └─────────────────────┘
```

### Sincronizar para OpenAgent (syncOutputConfigFile)

```
┌─────────────┐
│   db.json   │
│ (DbConfig)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     syncOutputConfigFile()       │
├─────────────────────────────────┤
│ 1. Ler agents/categories       │
│ 2. Aplicar transformers         │
│ 3. Gerar formato legado         │
│    - oh-my-openagent.json       │
└──────────────┬──────────────────┘
               │
               ▼
        ┌─────────────────────┐
        │oh-my-openagent.json  │
        │       (atômica)       │
        └─────────────────────┘
```

---

## Fluxo de Sincronização LiteLLM (syncToLiteLLM)

```
┌─────────────┐
│   db.json   │
│ (DbConfig)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│       syncToLiteLLM()           │
├─────────────────────────────────┤
│ 1. Verificar flag force         │
│ 2. Filtrar modelos se especificado│
│ 3. Para cada modelo:          │
│    - Construir spec do modelo    │
│    - Verificar se já sincronizado│
│    - Upsert no DB LiteLLM       │
└──────────────┬──────────────────┘
               │
               ▼
        ┌─────────────┐
        │LiteLLM DB   │
        │(spendLogs,  │
        │ proxyModel) │
        └─────────────┘
```

---

## Escitas Atômicas

Todas as escritas de arquivo usam operações atômicas:

```typescript
// Padrão usado em storage e geradores
const tmpPath = `${filePath}.tmp`;
await fs.promises.writeFile(tmpPath, content, "utf-8");
await fs.promises.rename(tmpPath, filePath);
```

Isso garante:
1. Nenhuma escrita parcial em caso de falha
2. Arquivo original preservado até a escrita completar
3. Estado consistente do arquivo para leitores

---

## Inicialização do Singleton

```
┌──────────────────────────────────────┐
│        createAgentsManager()          │
├──────────────────────────────────────┤
│ 1. Criar FileStorage com caminhos    │
│ 2. Criar AgentAdapter                │
│ 3. Criar CategoryAdapter             │
│ 4. Criar AgentTransformer            │
│ 5. Criar CategoryTransformer         │
└──────────────┬───────────────────────┘
               │
               ▼
        ┌─────────────┐
        │  Singletons  │
        │inicializados │
        └─────────────┘
```

A inicialização lazy ocorre na primeira chamada da API se `createAgentsManager()` não foi chamado.

---

## Resolução de Caminhos

```
AgentsManagerOptions
       │
       ▼
┌──────────────────────────────────────┐
│          FileStorage                   │
├──────────────────────────────────────┤
│ projectRoot: "/caminho/para/projeto" │
│ configDir: "db"  →  .../db           │
│ dataDir: "data"  →  .../data         │
│                                          │
│ dbFile: "db.json"  →  .../db/db.json   │
│ providersFile: "opencode.json"          │
│   →  .../data/opencode.json           │
│ vscodeModelsFile: "vscode-oaicopilot.json" │
│   →  .../data/vscode-oaicopilot.json │
└──────────────────────────────────────┘
```
