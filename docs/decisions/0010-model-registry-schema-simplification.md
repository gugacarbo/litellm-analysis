---
status: draft
date: 2026-07-08
builds-on: [ADR-0004, ADR-0006]
implemented-by: []
---

# Decisions for Model Registry Schema Simplification

> Captura as decisões iniciais para simplificar o schema e o contrato público
> dos modelos antes de implementar a mudança em código, banco e UI.

## Summary

O registro atual de modelos ainda carrega campos redundantes ou com naming
inconsistente no contrato e na persistência. Esta decisão consolida uma rodada
de simplificação para remover metadados pouco úteis, alinhar nomes de campos e
fazer com que informações de upstream venham da relação com o provider, em vez
de serem duplicadas por modelo.

## Chosen Approach

Aplicar um hard cut no schema/contrato de modelos com quatro mudanças:

1. Remover o campo `owned_by`.
2. Renomear `model_name` para `model_id`.
3. Renomear `context_window_size` para `context_length`.
3. Remover os campos de roteamento/upstream do modelo e passar a obtê-los pela
   relação com o provider:
   - `upstream_model`
   - `upstream_base_url`
   - `provider_name`
4. Adotar campos adicionais alinhados ao OpenRouter quando tiverem valor
   operacional ou forem úteis para preenchimento automático:
   - `canonical_slug`
   - `description`
   - `max_completion_tokens`
   - `knowledge_cutoff`
   - `expiration_date`
   - `default_parameters`
   - `per_request_limits`
5. Substituir `vision` por um campo estruturado `architecture`, alinhado ao
   shape do OpenRouter
6. Matar o campo genérico `metadata` e promover seus dados conhecidos para
   um único campo estruturado de primeira classe:
   - `reasoning`
   - incorporar em `reasoning` o que hoje está espalhado entre `thinking` e
     `reasoning`
   - remover `thinking` como bloco separado
   - remover `apiMode` da configuração de reasoning, mantendo `apiMode` apenas
     no campo principal do modelo
   - modelar diferenças de API de reasoning/thinking em uma tabela relacional
     própria, compartilhável entre modelos, referenciada por `reasoning`
7. Adotar `supported_parameters` como campo explícito do modelo
8. Substituir os campos achatados de custo por um campo estruturado `pricing`,
   alinhado à estrutura-base do OpenRouter

## Requirements Shaping These Decisions

- Reduzir duplicação entre `model_proxy_models` e `model_proxy_providers`
- Tornar o contrato de modelos mais claro para API, UI e sync
- Padronizar nomes com semântica explícita de unidade
- Trocar `name` ambíguo por `id` como identificador canônico do modelo
- Remover envelopes genéricos quando os dados reais já são conhecidos
- Preservar um único caminho de leitura/escrita alinhado ao banco como source
  of truth

## Constraints

- PostgreSQL continua como única fonte de verdade
- Drizzle schema continua sendo a fonte da verdade para migrations
- O hard cut deve atravessar schema, adapters, services, rotas HTTP, contracts,
  frontend e testes na mesma implementação
- Não deixar aliases de compatibilidade permanentes no contrato público
- Não introduzir suporte transitório a formatos legados via shim, dual-read,
  dual-write ou adapters de compatibilidade
- Atualizar os consumidores impactados no repo para o novo contrato na mesma
  rodada de implementação

## Assumptions

- `owned_by` não é mais necessário nem para roteamento nem para UX crítica
- `model_id` representa o identificador canônico público e persistido do modelo
- `context_length` representa o mesmo conceito hoje salvo como
  `context_window_size`
- Os dados de upstream removidos do modelo ainda existirão de forma resolvível
  a partir da relação com provider
- `canonical_slug`, `description`, `max_completion_tokens`,
  `knowledge_cutoff`, `expiration_date`, `default_parameters` e
  `per_request_limits` trazem valor suficiente para existir no schema do app
- `architecture` é uma representação melhor que `vision` isolado porque preserva
  input/output modalities e outros sinais úteis já fornecidos pelo OpenRouter
- O conteúdo útil de `metadata` hoje está concentrado em `thinking` e
  `reasoning`, então vale promovê-lo para um único campo explícito chamado
  `reasoning`
- `apiMode` no topo do modelo já é a fonte de verdade suficiente; duplicá-lo
  dentro da configuração de reasoning só aumenta drift
- diferenças reais entre vendors devem sair do modelo e morar em uma entidade
  relacional própria, para evitar blobs inline e permitir reuso entre modelos
- `supported_parameters` do OpenRouter é útil o bastante para existir como
  campo explícito do modelo
- `pricing` agrupado preserva a estrutura do provedor de origem melhor do que
  colunas achatadas de custo

## Non-Goals

- Definir neste documento o formato final exato das queries SQL ou joins
- Criar estratégia de migração retrocompatível em runtime
- Redesenhar a tela de modelos além do necessário para absorver o novo contrato

## Metadata Replacement Example

Exemplo do formato atual:

```json
{
  "metadata": {
    "thinking": {
      "levels": ["low", "medium", "high"]
    },
    "reasoning": {
      "effort": "medium",
      "enableThinking": true,
      "includeReasoningInRequest": true
    }
  }
}
```

Formato desejado após a mudança:

```json
{
  "architecture": {
    "input_modalities": ["text", "image"],
    "output_modalities": ["text"],
    "tokenizer": "Claude",
    "instruct_type": null
  },
  "reasoning": {
    "enabled": true,
    "levels": ["low", "medium", "high"],
    "effort": "medium",
    "reasoningApi": "deepseek-thinking-v1"
  },
  "supported_parameters": ["reasoning", "include_reasoning", "max_tokens"],
  "pricing": {
    "prompt": "0.000002",
    "completion": "0.00001",
    "internal_reasoning": "0.000003"
  }
}
```

## Provider-Specific Thinking/Reasoning Strategy

Os dados de reasoning devem ser separados em duas camadas:

1. **Semântica canônica do produto**
   - o que o modelo suporta ou como deve se comportar no produto
   - um campo explícito `reasoning`

2. **Mapeamento específico de API de reasoning/thinking**
   - como essa semântica vira payload HTTP real para cada vendor/API
   - usar uma tabela relacional própria, referenciável por vários modelos,
     em vez de jsonb inline no modelo

Exemplo de direção desejada:

```json
{
  "architecture": {
    "input_modalities": ["text", "image"],
    "output_modalities": ["text"],
    "tokenizer": "Other",
    "instruct_type": null
  },
  "reasoning": {
    "enabled": true,
    "levels": ["low", "medium", "high"],
    "effort": "medium",
    "reasoningApi": "deepseek-thinking-v1"
  },
  "supported_parameters": ["reasoning", "include_reasoning", "max_tokens"],
  "pricing": {
    "prompt": "0.0000002",
    "completion": "0.0000008"
  }
}
```

Exemplo da entidade relacional compartilhada:

```json
{
  "id": "deepseek-thinking-v1",
  "name": "DeepSeek Thinking v1",
  "provider": "deepseek",
  "requestParams": {
    "enabled": "$reasoning.enabled",
    "effort": "$reasoning.effort"
  },
  "requestShape": {
    "requestBody": {
      "thinking": {
        "type": {
          "$if": {
            "param": "enabled",
            "equals": true,
            "then": "enabled",
            "else": "disabled"
          }
        }
      }
    }
  }
}
```

Exemplo de uso pelo modelo:

```json
{
  "modelId": "deepseek-chat",
  "architecture": {
    "input_modalities": ["text"],
    "output_modalities": ["text"],
    "tokenizer": "Other",
    "instruct_type": null
  },
  "reasoning": {
    "enabled": true,
    "levels": ["low", "medium", "high"],
    "effort": "medium",
    "reasoningApi": "deepseek-thinking-v1"
  },
  "supported_parameters": ["reasoning", "include_reasoning", "max_tokens"],
  "pricing": {
    "prompt": "0.0000002",
    "completion": "0.0000008"
  }
}
```

Exemplo da saída final na request:

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "thinking": {
    "type": "enabled"
  }
}
```

Exemplo não booleano, no estilo OpenAI:

```json
{
  "id": "openai-reasoning-v1",
  "name": "OpenAI Reasoning v1",
  "provider": "openai-compatible",
  "requestParams": {
    "effort": "$reasoning.effort"
  },
  "requestShape": {
    "requestBody": {
      "reasoning_effort": "$params.effort"
    }
  }
}
```

Exemplo de uso pelo modelo:

```json
{
  "modelId": "gpt-5",
  "architecture": {
    "input_modalities": ["text", "image", "file"],
    "output_modalities": ["text"],
    "tokenizer": "Claude",
    "instruct_type": null
  },
  "reasoning": {
    "enabled": true,
    "levels": ["low", "medium", "high"],
    "effort": "medium",
    "reasoningApi": "openai-reasoning-v1"
  },
  "supported_parameters": ["reasoning", "include_reasoning", "max_tokens"],
  "pricing": {
    "prompt": "0.000002",
    "completion": "0.00001"
  }
}
```

Exemplo da saída final na request:

```json
{
  "model": "gpt-5",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "reasoning_effort": "medium"
}
```

Nesse modelo, a entidade relacional representa principalmente o **shape** do
payload. Os valores variáveis não precisam ficar hardcoded dentro de
`requestShape`; eles são declarados em `requestParams` e injetados
dinamicamente na montagem do request.

Direção desejada:

- `requestParams` define quais inputs dinâmicos o shape espera
- `requestShape` descreve a estrutura do payload do provider
- o renderer do request resolve placeholders/expressões do shape a partir dos
  params vindos do modelo (`reasoning.enabled`, `reasoning.effort`, etc.)

Essa separação evita dois extremos ruins:

- campos rígidos demais para every provider-specific nuance
- um blob genérico opaco como `metadata`

## Proposed Final Models Table Schema

Schema consolidado esperado para a tabela principal de modelos após a
implementação deste pacote de mudanças:

```ts
type ModelRecord = {
  id: string; // uuid interno do registro
  model_id: string; // identificador canônico do modelo; importável do OpenRouter (`id`)
  enabled: boolean;

  name: string | null; // display name / nome legível; importável do OpenRouter (`name`)
  canonical_slug: string | null; // importável do OpenRouter (`canonical_slug`)
  family: string | null;
  description: string | null; // importável do OpenRouter (`description`)

  context_length: number | null; // importável do OpenRouter (`context_length`)
  max_completion_tokens: number | null; // importável do OpenRouter (`top_provider.max_completion_tokens`)
  knowledge_cutoff: string | null; // importável do OpenRouter (`knowledge_cutoff`)
  expiration_date: string | null; // importável do OpenRouter (`expiration_date`)

  architecture: {
    input_modalities: string[]; // importável do OpenRouter (`architecture.input_modalities`)
    output_modalities: string[]; // importável do OpenRouter (`architecture.output_modalities`)
    tokenizer: string | null; // importável do OpenRouter (`architecture.tokenizer`)
    instruct_type: string | null; // importável do OpenRouter (`architecture.instruct_type`)
  } | null; // importável do OpenRouter (`architecture`)

  reasoning: {
    enabled: boolean;
    levels: string[];
    effort: string | null;
    reasoning_api: string | null;
  } | null; // parcialmente importável do OpenRouter (`reasoning`), exceto `reasoning_api` que depende de mapeamento interno

  supported_parameters: string[] | null; // importável do OpenRouter (`supported_parameters`)
  default_parameters: Record<string, unknown> | null; // importável do OpenRouter (`default_parameters`)
  per_request_limits: Record<string, unknown> | null; // importável do OpenRouter (`per_request_limits`)

  pricing: {
    prompt: string | null; // importável do OpenRouter (`pricing.prompt`)
    completion: string | null; // importável do OpenRouter (`pricing.completion`)
    request?: string | null; // importável do OpenRouter (`pricing.request`)
    image?: string | null; // importável do OpenRouter (`pricing.image`)
    web_search?: string | null; // importável do OpenRouter (`pricing.web_search`)
    internal_reasoning?: string | null; // importável do OpenRouter (`pricing.internal_reasoning`)
    input_cache_read?: string | null; // importável do OpenRouter (`pricing.input_cache_read`)
    input_cache_write?: string | null; // importável do OpenRouter (`pricing.input_cache_write`)
  } | null; // importável do OpenRouter (`pricing`)

  provider_id: string | null; // relação com provider

  created_at: Date;
  updated_at: Date;
};
```

Observações de intenção:

- `model_id` substitui `model_name` como identificador principal
- `name` substitui o papel de `display_name`
- `canonical_slug` preserva o identificador estável externo do OpenRouter
- `architecture` substitui `vision` e preserva o shape-base do OpenRouter
- `reasoning` substitui os blocos separados `thinking` + `reasoning`
- `supported_parameters` vira campo explícito alinhado ao OpenRouter
- `default_parameters` e `per_request_limits` entram como objetos estruturados
  úteis para automação e UI avançada
- `pricing` substitui campos achatados de custo
- `provider_id` representa a relação com provider; os dados de upstream não
  ficam mais duplicados na tabela de modelos
- `owned_by`, `metadata`, `upstream_model`, `upstream_base_url`,
  `provider_name`, `context_window_size`, `input_cost_per_token`,
  `output_cost_per_token` e `vision` deixam de existir no formato final

## Risks and Tradeoffs

- **Tradeoff:** um hard cut sem camada de compatibilidade aumenta o esforço
  imediato de atualização do repo, mas evita prolongar dívida técnica e drift
  entre contratos.
- **Risco:** remover `provider_name` do modelo pode exigir revisão de chaves
  únicas, joins e fluxos de sync onde o provider hoje participa da identidade
  ou resolução do registro. **Mitigação:** fechar isso na spec/plan antes de
  editar migrations.
- **Risco:** renomear campos de custo pode quebrar cálculos e UI se houver
  código assumindo valor por token. **Mitigação:** mapear todos os consumidores
  e exigir teste de regressão para API, tabela e logs.
- **Tradeoff:** a simplificação reduz redundância no modelo, mas aumenta a
  dependência explícita da relação com provider para reconstruir dados de
  upstream.
- **Tradeoff:** adicionar mais campos espelha melhor o OpenRouter e melhora
  auto-import, mas aumenta largura de schema e a necessidade de decidir quais
  deles são editáveis vs somente sincronizados.
- **Tradeoff:** trocar `vision` por `architecture` deixa o schema mais rico e
  alinhado ao OpenRouter, mas aumenta a complexidade do payload e da UI quando
  só precisamos de um booleano simples.
- **Tradeoff:** remover `metadata` reduz flexibilidade para blobs arbitrários,
  mas melhora tipagem, clareza do contrato e previsibilidade de leitura/escrita.
- **Tradeoff:** tirar `apiMode` da configuração de reasoning simplifica o contrato, mas exige
  revisar qualquer consumer que hoje leia esse valor no objeto aninhado.
- **Tradeoff:** uma tabela como `reasoning_api` melhora reuso, deduplicação e
  governança da variação entre vendors, mas adiciona join e uma nova entidade
  para manter consistente.
- **Tradeoff:** tratar `reasoning_api` como shape + params deixa a modelagem mais
  expressiva e compartilhável, mas exige definir uma mini-linguagem estável
  para placeholders/expressões dentro de `requestShape`.
- **Tradeoff:** unificar `thinking` e `reasoning` sob `reasoning` reduz fragmentação do
  contrato, mas exige migrar forms, adapters e testes que hoje tratam ambos
  como blocos distintos.
- **Tradeoff:** adotar `supported_parameters` aproxima o schema do OpenRouter e
  facilita importação automática, mas cria um campo orientado a capability
  externa que talvez outros providers não preencham com a mesma qualidade.
- **Tradeoff:** adotar `pricing` estruturado aproxima o schema do OpenRouter e
  preserva mais detalhes de custo, mas exige revisar todos os consumidores que
  hoje assumem campos achatados de input/output cost.

## Open Questions

- [ ] Se `provider_name` sair do modelo, qual passa a ser a identidade canônica
      do vínculo entre um model route e seu provider?
- [ ] O rename `model_name` -> `model_id` também implica renomear conceitos
      derivados como `ModelRoute.modelName`, params de rota e labels de UI?
- [ ] `upstream_model` deve mesmo sair do modelo, ou ele continua necessário
      como override por-modelo mesmo com provider relacional?
- [ ] `default_parameters` e `per_request_limits` serão editáveis no app ou
      somente sincronizados de fontes externas?
- [ ] `architecture` será persistido como jsonb próprio ou quebrado em colunas
      derivadas no registry com um adapter público no formato OpenRouter?
- [ ] `reasoning` será um jsonb próprio no registry ou apenas um campo do
      contrato com mapeamento interno próprio?
- [ ] Há algum consumer externo ou fixture que ainda dependa de
      `thinking` como bloco separado?
- [ ] `supported_parameters` será persistido como array/jsonb no modelo ou
      resolvido dinamicamente a partir da entidade relacional de API?
- [ ] `pricing` ficará totalmente no formato OpenRouter ou manteremos alguma
      normalização adicional para valores por milhão no domínio interno?
- [ ] O nome final da nova tabela será `reasoning_api`, `reasoning_apis` ou
      outro alinhado ao padrão do repo?
- [ ] O vínculo do modelo com essa entidade será por FK direta
      (`reasoning_api_id`) ou por tabela de junção?
- [ ] A entidade de API de reasoning será definida por provider, por api mode
      ou por variante/versionamento de payload?
- [ ] Qual será a sintaxe oficial de placeholders/expressões em `requestShape`
      e qual parte do sistema fará a resolução?
- [ ] Os novos campos `*_per_million_token` guardarão valor já convertido por
      milhão ou apenas mudarão de nome no contrato?

## Carry Forward to Spec

- [x] Remover `owned_by`
- [x] Renomear `model_name` para `model_id`
- [x] Renomear `context_window_size` para `context_length`
- [x] Remover `upstream_model`, `upstream_base_url` e `provider_name` do modelo
- [x] Resolver upstream pela relação com provider
- [x] Adotar `canonical_slug`, `description`, `max_completion_tokens`,
      `knowledge_cutoff`, `expiration_date`, `default_parameters` e
      `per_request_limits`
- [x] Substituir `vision` por `architecture` alinhado ao OpenRouter
- [x] Remover `metadata` e promover o conteúdo útil para um único campo `reasoning`
- [x] Remover `thinking` como bloco separado e incorporar seus campos em `reasoning`
- [x] Remover `apiMode` da configuração de reasoning e manter `apiMode` apenas no topo do modelo
- [x] Separar semântica canônica de thinking/reasoning da definição de payload
      específica de API por meio de uma entidade relacional compartilhável
- [x] Tratar a entidade relacional compartilhada como shape reutilizável com
      `requestParams` dinâmicos resolvidos dentro de `requestShape`
- [x] Adotar `supported_parameters` como campo explícito alinhado ao OpenRouter
- [x] Substituir campos achatados de custo por `pricing` alinhado ao OpenRouter
