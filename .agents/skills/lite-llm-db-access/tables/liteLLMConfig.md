# Table: liteLLMConfig

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch
Mapeia a tabela `LiteLLM_Config` do banco de dados para configurações do proxy/roteador.

- `paramName`: varchar (PK) -> mapeado do DB `param_name`
- `paramValue`: jsonb -> mapeado do DB `param_value`

## Descrição de Armazenamento de Chaves (Resposta ao Teste 1)
No repositório do LiteLLM, as configurações (incluindo chaves de provedores) ficam serializadas no campo `paramValue` (JSON). Dependendo da versão do LiteLLM rodando, dados sensíveis podem ser mascarados diretamente na engine Python e salvos na secret DB (hash/salt), porém a configuração visível fica aqui no Postgres. Em grande parte dos setups, as chaves reais são passadas via variável de ambiente, e o banco detém referências da configuração geral do roteador.

## Example Record
```json
{
  "paramName": "general_settings",
  "paramValue": {
    "master_key": "sk-1234********890",
    "alerting": ["slack"],
    "alerting_threshold": 100
  }
}
```
