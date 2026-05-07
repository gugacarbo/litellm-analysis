# @lite-llm/agents-manager — Especificação

## Visão Geral

Gerenciamento de configuração de agentes/categorias com armazenamento baseado em arquivos. Gerencia operações CRUD em configurações de agentes e categorias, e gera arquivos de configuração para consumidores como OpenCode, VS Code e OpenAgent.

## Responsabilidades do Pacote

1. **Operações CRUD** — Ler/escrever configurações de agentes e categorias em/from `db.json`
2. **Transformação de Formato** — Converter entre formato interno DB e formato externo de configuração
3. **Geração de Configurações para Consumidores** — Gerar arquivos de provider para OpenCode, VS Code e OpenAgent
4. **Sincronização LiteLLM** — Sincronizar configurações de modelos com o banco de dados LiteLLM

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Pública                               │
│  (createAgentsManager, readDb, updateAgentInDb, writeProvidersFile, etc.)
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                         api/                                      │
│  crud.ts — Operações CRUD em db.json                             │
│  singleton.ts — Inicialização do gerenciador singleton           │
│  litellm-sync.ts — Sincronização com LiteLLM                    │
│  sync.ts — Sincronização de arquivos de configuração de output   │
│  providers.ts / vscode.ts — Wrappers dos geradores              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────────┐    ┌─────────────┐
   │ storage │       │  adapters/  │    │transformers/│
   │         │       │  DB ↔ Config│    │ DB → Output│
   └─────────┘       └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │generators/ │
                    │Escrita de   │
                    │arquivos     │
                    └─────────────┘
```

## Fluxo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   db.json    │────▶│  Adapters    │────▶│  Config APIs │
│  (interno)   │     │  (toDb/toApi)│     │(AgentConfig)│
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                     ┌──────────────────────────┘
                     ▼
              ┌──────────────┐
              │ Transformers │────┐
              │   (toOutput) │    │
              └──────────────┘    │
                                   ▼
                     ┌──────────────────────────┐
                     │       Geradores          │
                     │ writeProvidersFile()      │
                     │ writeVscodeModelsFile()  │
                     │ syncOutputConfigFile()    │
                     └──────────────────────────┘
                                   │
                                   ▼
                     ┌──────────────────────────┐
                     │    Arquivos de Output    │
                     │ • data/opencode.json     │
                     │ • data/vscode-oaicopilot.json│
                     │ • data/oh-my-openagent.json │
                     └──────────────────────────┘
```

## Conceitos Principais

### Formato Interno (db.json)
O formato interno armazenado em `db.json` usa camelCase com nomes de propriedades completos:
- `fallbackModels` (não `fallback_models`)
- `prompt_append` (snake_case preservado para compatibilidade com LiteLLM)

### Formato Externo (AgentConfig/CategoryConfig)
O formato de API/consumidor usa snake_case para consistência com LiteLLM:
- `fallback_models` (snake_case)
- Compatível com tipos de `@litellm/shared`

### Alias de Modelos
Agentes são expostos com aliases de modelos (ex: `coder/gpt-4o`, `coder/o3`). O primeiro alias (`MODEL_NAMES[0]`) é o modelo primário; o restante forma a cadeia de fallback.

## Caminhos de Arquivos

| Arquivo                | Caminho Padrão                     | Propósito                       |
| ---------------------- | ---------------------------------- | ------------------------------- |
| `db.json`              | `{configDir}/db.json`              | Fonte da verdade                |
| `providers.json`       | `{dataDir}/opencode.json`          | Config de provider OpenCode     |
| `vscode-models.json`   | `{dataDir}/vscode-oaicopilot.json` | Lista de modelos VS Code        |
| `oh-my-openagent.json` | `{dataDir}/oh-my-openagent.json`   | Config OpenAgent                |
| `legacy-config.json`   | `{configDir}/config.json`          | Config legado (somente leitura) |

## Padrão de Uso

```typescript
import { createAgentsManager, readDb, updateAgentInDb, writeProvidersFile } from "@lite-llm/agents-manager";

// 1. Inicializar o gerenciador (chamar uma vez no início do app)
createAgentsManager({
  projectRoot: process.cwd(),
  configDir: "config",
  dataDir: "data",
});

// 2. Operações CRUD
const db = await readDb();
await updateAgentInDb("coder", { model: "gpt-4o", temperature: 0.7 });

// 3. Gerar configurações para consumidores
await writeProvidersFile();
await writeVscodeModelsFile();
```

## Dependências

- `@lite-llm/alias-router` — Resolução de alias de modelos
- `@lite-llm/config` — Configuração de ambiente (schemas Zod)

## Build & Test

```bash
pnpm --filter @lite-llm/agents-manager build
pnpm --filter @lite-llm/agents-manager test
pnpm --filter @lite-llm/agents-manager typecheck
```

## Notas

- Todas as imports usam extensão `.js` (requisito ESM/verbatimModuleSyntax)
- Padrão singleton para storage/adapters (inicialização lazy)
- Escritas atômicas usando padrão `.tmp` + `rename()`
- Arquivo de config legado é somente leitura (não é escrito de volta)
