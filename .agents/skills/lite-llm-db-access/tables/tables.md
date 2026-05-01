# Database Tables Index

This index tracks tables in the `lite-llm-analytics` PostgreSQL database. It is maintained automatically by the `lite-llm-db-access` skill.

| Table Name              | Description                                                                                | Reference                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| liteLLMConfig           | Stores global configuration parameters, including API keys and routing rules.              | [liteLLMConfig.md](./liteLLMConfig.md)                     |
| liteLLMCredentialsTable | Stores named provider credentials and metadata used by proxy model routes.                 | [liteLLMCredentialsTable.md](./liteLLMCredentialsTable.md) |
| liteLLMVerificationToken | Stores active proxy access token hashes, aliases, and expiration metadata.                | [liteLLMVerificationToken.md](./liteLLMVerificationToken.md) |
| liteLLMDeletedVerificationToken | Stores revoked/deleted proxy token hashes with deletion metadata.               | [liteLLMDeletedVerificationToken.md](./liteLLMDeletedVerificationToken.md) |
| liteLLMProxyModelTable  | Stores proxy model definitions and `litellm_params` routing/auth settings.                 | [liteLLMProxyModelTable.md](./liteLLMProxyModelTable.md)   |
| spendLogs               | Stores all LLM API request logs, costs, latency, inputs (messages) and outputs (response). | [spendLogs.md](./spendLogs.md)                             |
