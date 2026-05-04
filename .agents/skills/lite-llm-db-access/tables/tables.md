# Database Tables Index

This index tracks tables in the `lite-llm-analytics` PostgreSQL database. It is maintained automatically by the `lite-llm-db-access` skill.

| Table Name    | Description                                                                                | Reference                              |
| ------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| liteLLMConfig | Stores global configuration parameters, including API keys and routing rules.              | [liteLLMConfig.md](./liteLLMConfig.md) |
| spendLogs     | Stores all LLM API request logs, costs, latency, inputs (messages) and outputs (response). | [spendLogs.md](./spendLogs.md)         |
