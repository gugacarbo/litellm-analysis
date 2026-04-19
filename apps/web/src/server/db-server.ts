import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'litellm',
  user: process.env.VITE_DB_USER || 'llmproxy',
  password: process.env.VITE_DB_PASSWORD || 'dbpassword9090',
  max: 10,
  idleTimeoutMillis: 30000,
});

async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function getSpendByModel() {
  return query<{ model: string; total_spend: number }>(`
    SELECT model, SUM(spend) as total_spend 
    FROM "LiteLLM_SpendLogs" 
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY model 
    ORDER BY total_spend DESC
    LIMIT 20
  `);
}

export async function getSpendLogs(params: {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions: string[] = ['1=1'];
  const values: unknown[] = [];
  let idx = 1;

  if (params.model) {
    conditions.push(`model = $${idx++}`);
    values.push(params.model);
  }
  if (params.user) {
    conditions.push(`user = $${idx++}`);
    values.push(params.user);
  }
  if (params.startDate) {
    conditions.push(`"startTime" >= $${idx++}`);
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push(`"startTime" <= $${idx++}`);
    values.push(params.endDate);
  }

  const limit = params.limit || 50;
  const offset = params.offset || 0;

  values.push(limit, offset);

  return query(
    `
    SELECT request_id, model, user, total_tokens, prompt_tokens, completion_tokens, 
           spend, "startTime", "endTime", api_key, status
    FROM "LiteLLM_SpendLogs" 
    WHERE ${conditions.join(' AND ')}
    ORDER BY "startTime" DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `,
    values,
  );
}

export async function getSpendByUser() {
  return query<{ user: string; total_spend: number; total_tokens: number }>(`
    SELECT user, SUM(spend) as total_spend, SUM(total_tokens) as total_tokens
    FROM "LiteLLM_SpendLogs" 
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY user 
    ORDER BY total_spend DESC
    LIMIT 20
  `);
}

export async function getSpendByKey() {
  return query<{ key: string; total_spend: number; total_tokens: number }>(`
    SELECT api_key as key, SUM(spend) as total_spend, SUM(total_tokens) as total_tokens
    FROM "LiteLLM_SpendLogs" 
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY api_key 
    ORDER BY total_spend DESC
    LIMIT 20
  `);
}

export async function getModelDetails() {
  return query<{
    model_name: string;
    input_cost_per_token: string;
    output_cost_per_token: string;
  }>(`
    SELECT model_name, 
           litellm_params->>'input_cost_per_token' as input_cost_per_token,
           litellm_params->>'output_cost_per_token' as output_cost_per_token
    FROM "LiteLLM_ProxyModelTable"
  `);
}

export async function getErrorLogs(limit = 50) {
  return query<{
    id: string;
    error_type: string;
    model: string;
    user: string;
    error_message: string;
    timestamp: string;
    status_code: number;
  }>(
    `
    SELECT 
      request_id as id, 
      exception_type as error_type, 
      litellm_model_name as model, 
      request_kwargs->>'user' as user, 
      COALESCE(exception_string, 'Unknown error') as error_message, 
      "startTime" as timestamp,
      status_code as status_code
    FROM "LiteLLM_ErrorLogs" 
    ORDER BY "startTime" DESC
    LIMIT $1
  `, [limit]);
}

export async function getMetricsSummary() {
  const [spend, users, errors, models] = await Promise.all([
    getSpendByModel(),
    getSpendByUser(),
    getErrorLogs(0),
    query<{ count: number }>(
      `SELECT COUNT(DISTINCT model) as count FROM "LiteLLM_SpendLogs" WHERE "startTime" >= NOW() - INTERVAL '30 days'`,
    ),
  ]);

  const totalSpend = spend.reduce((sum, m) => sum + Number(m.total_spend), 0);
  const totalTokens = users.reduce(
    (sum, u) => sum + Number(u.total_tokens || 0),
    0,
  );

  return {
    totalSpend,
    totalTokens,
    activeModels: models[0]?.count || 0,
    errorCount: errors.length,
  };
}

export async function getDailySpendTrend(days = 30) {
  return query<{ date: string; spend: number }>(`
    SELECT DATE("startTime") as date, SUM(spend) as spend
    FROM "LiteLLM_SpendLogs" 
    WHERE "startTime" >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE("startTime")
    ORDER BY date ASC
  `);
}

export async function getTokenDistribution() {
  return query<{
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    input_output_ratio: number;
  }>(`
    SELECT 
      model,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      AVG(total_tokens) as avg_tokens_per_request,
      CASE WHEN SUM(completion_tokens) > 0 
        THEN SUM(prompt_tokens)::float / SUM(completion_tokens) 
        ELSE 0 
      END as input_output_ratio
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY model
    ORDER BY (SUM(prompt_tokens) + SUM(completion_tokens)) DESC
    LIMIT 20
  `);
}

export async function getPerformanceMetrics() {
  const result = await query<{
    total_requests: number;
    avg_duration_ms: number;
    success_rate: number;
  }>(`
    SELECT 
      COUNT(*) as total_requests,
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000) as avg_duration_ms,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100 as success_rate
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
      AND "endTime" IS NOT NULL
  `);
  return result[0] || { total_requests: 0, avg_duration_ms: 0, success_rate: 0 };
}

export async function getHourlyUsagePatterns() {
  return query<{ hour: number; request_count: number; total_spend: number; total_tokens: number }>(`
    SELECT 
      EXTRACT(HOUR FROM "startTime") as hour,
      COUNT(*) as request_count,
      SUM(spend) as total_spend,
      SUM(total_tokens) as total_tokens
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(HOUR FROM "startTime")
    ORDER BY hour
  `);
}

export async function getApiKeyDetailedStats() {
  return query<{
    key: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    avg_tokens_per_request: number;
    success_rate: number;
    last_used: string;
  }>(`
    SELECT 
      api_key as key,
      COUNT(*) as request_count,
      SUM(spend) as total_spend,
      SUM(total_tokens) as total_tokens,
      AVG(total_tokens) as avg_tokens_per_request,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100 as success_rate,
      MAX("startTime") as last_used
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY api_key
    ORDER BY total_spend DESC
    LIMIT 20
  `);
}

export async function getCostEfficiencyByModel() {
  return query<{
    model: string;
    total_spend: number;
    total_tokens: number;
    cost_per_1k_tokens: number;
    request_count: number;
  }>(`
    SELECT 
      model,
      SUM(spend) as total_spend,
      SUM(total_tokens) as total_tokens,
      CASE WHEN SUM(total_tokens) > 0 
        THEN SUM(spend) / SUM(total_tokens) * 1000 
        ELSE 0 
      END as cost_per_1k_tokens,
      COUNT(*) as request_count
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY model
    ORDER BY total_spend DESC
    LIMIT 20
  `);
}

export async function getModelRequestDistribution() {
  return query<{
    model: string;
    request_count: number;
    percentage: number;
  }>(`
    WITH total AS (
      SELECT COUNT(*)::float as total_count FROM "LiteLLM_SpendLogs"
      WHERE "startTime" >= NOW() - INTERVAL '30 days'
    )
    SELECT 
      model,
      COUNT(*) as request_count,
      (COUNT(*) * 100.0 / NULLIF((SELECT total_count FROM total), 0))::numeric(10,2) as percentage
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY model
    ORDER BY request_count DESC
    LIMIT 15
  `);
}

export async function getDailyTokenTrend(days = 30) {
  return query<{ date: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }>(`
    SELECT 
      DATE("startTime") as date,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      SUM(total_tokens) as total_tokens
    FROM "LiteLLM_SpendLogs" 
    WHERE "startTime" >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE("startTime")
    ORDER BY date ASC
  `);
}

export async function getTopModelsByRequests(limit = 10) {
  return query<{ model: string; request_count: number }>(`
    SELECT model, COUNT(*) as request_count
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
    GROUP BY model
    ORDER BY request_count DESC
    LIMIT ${limit}
  `);
}

export async function getModelStatistics() {
  return query<{
    model: string;
    request_count: number;
    total_spend: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    avg_tokens_per_request: number;
    avg_latency_ms: number;
    success_rate: number;
    error_count: number;
    avg_input_cost: number;
    avg_output_cost: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    first_seen: string;
    last_seen: string;
    unique_users: number;
    unique_api_keys: number;
  }>(`
    SELECT 
      model,
      COUNT(*) as request_count,
      SUM(spend) as total_spend,
      SUM(total_tokens) as total_tokens,
      SUM(prompt_tokens) as prompt_tokens,
      SUM(completion_tokens) as completion_tokens,
      AVG(total_tokens) as avg_tokens_per_request,
      AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000) as avg_latency_ms,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*), 0) * 100 as success_rate,
      SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as error_count,
      AVG(CASE WHEN prompt_tokens > 0 THEN spend * prompt_tokens::float / total_tokens ELSE 0 END) as avg_input_cost,
      AVG(CASE WHEN completion_tokens > 0 THEN spend * completion_tokens::float / total_tokens ELSE 0 END) as avg_output_cost,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000) as p50_latency_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000) as p95_latency_ms,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("endTime" - "startTime")) * 1000) as p99_latency_ms,
      MIN("startTime") as first_seen,
      MAX("startTime") as last_seen,
      COUNT(DISTINCT user) as unique_users,
      COUNT(DISTINCT api_key) as unique_api_keys
    FROM "LiteLLM_SpendLogs"
    WHERE "startTime" >= NOW() - INTERVAL '30 days'
      AND "endTime" IS NOT NULL
    GROUP BY model
    ORDER BY total_spend DESC
    LIMIT 50
  `);
}
