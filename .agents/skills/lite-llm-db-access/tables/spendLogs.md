# Table: spendLogs

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch
Mapeia a tabela `LiteLLM_SpendLogs` no banco de dados.

Principais colunas investigadas no Teste 3:
- `messages`: jsonb -> armazena o histórico do array de mensagens enviadas para o LLM. Nele é possível ver qual foi o Input.
- `response`: jsonb -> armazena o JSON completo da resposta retornada pela API do modelo, incluindo a property `choices` que contém o Output.

 Outras colunas do banco mapeadas para o ORM (camelCase -> snake_case):
- `requestId`: varchar (PK) -> `request_id`
- `model`: varchar (NotNull) -> `model`
- `totalTokens`: integer -> `total_tokens`
- `spend`: real -> `spend`
- `apiKey`: varchar -> `api_key`

## Example Record
JSON exemplificando o formato encontrado e a visualização do input/output da mensagem (Teste 3):

```json
{
  "requestId": "req_12345",
  "model": "gpt-4o",
  "spend": 0.015,
  "apiKey": "sk-1234",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is the capital of France?"}
  ],
  "response": {
    "id": "chatcmpl-123",
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": "The capital of France is Paris."
        }
      }
    ],
    "usage": {
      "total_tokens": 20
    }
  }
}
```
