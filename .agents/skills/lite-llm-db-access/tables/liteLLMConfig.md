# Table: liteLLMConfig

> **Note:** This is a cached reference. Data changes frequently in the live database. Always run a query if exact real-time precision is needed.

## Schema Sketch
A tabela mapeia `LiteLLM_Config` do Postgres.
- `paramName`: varchar (PK)
- `paramValue`: jsonb

Na coluna `paramValue` do tipo JSONB não há recurso de mascaramento no banco de dados, então valores que não são encriptados pela aplicação ficam em texto simples.

## Example Record
```json
{
  "paramName": "general_settings",
  "paramValue": {
    "ui_access_mode": "all",
    "store_model_in_db": true,
    "health_check_interval": 300,
    "enable_public_model_hub": false,
    "database_connection_timeout": 60,
    "store_prompts_in_spend_logs": true,
    "database_connection_pool_limit": 10
  }
}
```
