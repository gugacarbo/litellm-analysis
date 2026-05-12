import { describe, expect, it } from "vitest";
import type {
  AgentCatalogDetailResponse,
  AgentCatalogEntry,
  AgentCatalogResponse,
  SystemAgent,
} from "../agent-routing";
import type {
  CostEfficiency,
  DailySpend,
  DailyTokenTrend,
  DashboardFilters,
  ErrorLog,
  HourlyPattern,
  KeyAnalytics,
  KeySpend,
  MetricsSummary,
  ModelConfig,
  ModelDetail,
  ModelDistribution,
  ModelStatistics,
  PaginationMetadata,
  PerformanceMetrics,
  SpendByModel,
  SpendLog,
  TokenDistribution,
  UserSpend,
} from "../analytics";

describe("@lite-llm/api-contracts", () => {
  describe("type exports are importable (compile-time check)", () => {
    it("imports agent-routing types", () => {
      const _agentEntry: AgentCatalogEntry = {
        key: "test",
        displayName: "Test",
        icon: "T",
        description: "A test agent",
        limits: { context: 200000, output: 32768 },
        model: "gpt-4",
        fallbackModels: [],
        enabledPlugins: [],
        config: {},
      };
      const _catalogResp: AgentCatalogResponse = { agents: [_agentEntry] };
      const _detailResp: AgentCatalogDetailResponse = {
        key: "test",
        agent: {
          displayName: "Test",
          icon: "T",
          description: "A test agent",
          limits: { context: 200000, output: 32768 },
          model: "gpt-4",
          fallbackModels: [],
          config: {},
        },
      };
      expect(_agentEntry.displayName).toBe("Test");
      expect(_catalogResp.agents).toHaveLength(1);
      expect(_detailResp.key).toBe("test");
      expect(_detailResp.agent.displayName).toBe("Test");
    });

    it("imports analytics types", () => {
      const spendByModel: SpendByModel = {
        model: "gpt-4",
        total_spend: 100,
      };
      const pagination: PaginationMetadata = {
        total: 100,
        page: 1,
        page_size: 20,
        total_pages: 5,
      };
      const spendLog: SpendLog = {
        request_id: "req-1",
        model: "gpt-4",
        user: "user-1",
        total_tokens: 100,
        prompt_tokens: 50,
        completion_tokens: 50,
        spend: 0.01,
        time_to_first_token_ms: null,
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2024-01-01T00:00:01Z",
        api_key: "sk-...",
        status: "completed",
      };
      const errorLog: ErrorLog = {
        id: "err-1",
        error_type: "timeout",
        model: "gpt-4",
        user: "user-1",
        error_message: "Request timed out",
        api_key: null,
        spend_status: null,
        timestamp: "2024-01-01T00:00:00Z",
        status_code: 500,
        litellm_model_name: null,
        request_kwargs: null,
        total_tokens: null,
        prompt_tokens: null,
        completion_tokens: null,
        spend: null,
        end_time: null,
      };
      const filters: DashboardFilters = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        model: "gpt-4",
      };
      const summary: MetricsSummary = {
        totalSpend: 500,
        totalTokens: 10000,
        activeModels: 3,
        errorCount: 2,
      };

      expect(spendByModel.model).toBe("gpt-4");
      expect(pagination.total_pages).toBe(5);
      expect(spendLog.request_id).toBe("req-1");
      expect(errorLog.error_type).toBe("timeout");
      expect(filters.model).toBe("gpt-4");
      expect(summary.activeModels).toBe(3);

      const userSpend: UserSpend = {
        user: "u1",
        total_spend: 50,
        total_tokens: 5000,
        request_count: 10,
      };
      const keySpend: KeySpend = {
        key: "k1",
        total_spend: 100,
        total_tokens: 10000,
      };
      const dailySpend: DailySpend = {
        date: "2024-01-01",
        spend: 10,
        tokens: 1000,
      };
      const modelDetail: ModelDetail = {
        model_name: "gpt-4",
        input_cost_per_token: "0.000003",
        output_cost_per_token: "0.000012",
      };
      const modelConfig: ModelConfig = {
        modelName: "gpt-4",
        litellmParams: { temperature: 0.7 },
      };
      const modelStats: ModelStatistics = {
        model: "gpt-4",
        request_count: 100,
        total_spend: 50,
        total_tokens: 50000,
        prompt_tokens: 30000,
        completion_tokens: 20000,
        avg_tokens_per_request: 500,
        avg_latency_ms: 100,
        success_rate: 0.99,
        error_count: 1,
        avg_input_cost: 0.000003,
        avg_output_cost: 0.000012,
        p50_latency_ms: 80,
        p95_latency_ms: 200,
        p99_latency_ms: 500,
        first_seen: "2024-01-01T00:00:00Z",
        last_seen: "2024-01-31T00:00:00Z",
        unique_users: 5,
        unique_api_keys: 3,
      };
      const perf: PerformanceMetrics = {
        total_requests: 100,
        avg_duration_ms: 150,
        success_rate: 0.98,
      };
      const tokenDist: TokenDistribution = {
        model: "gpt-4",
        prompt_tokens: 30000,
        completion_tokens: 20000,
        avg_tokens_per_request: 500,
        input_output_ratio: 1.5,
      };
      const hourly: HourlyPattern = {
        hour: 14,
        request_count: 50,
        total_spend: 5,
        total_tokens: 5000,
      };
      const keyAnalytics: KeyAnalytics = {
        key: "sk-...",
        request_count: 100,
        total_spend: 50,
        total_tokens: 50000,
        avg_tokens_per_request: 500,
        success_rate: 0.95,
        last_used: "2024-01-31T00:00:00Z",
      };
      const costEff: CostEfficiency = {
        model: "gpt-4",
        total_spend: 50,
        total_tokens: 50000,
        cost_per_1k_tokens: 0.001,
        request_count: 100,
      };
      const modelDist: ModelDistribution = {
        model: "gpt-4",
        request_count: 100,
        percentage: 50,
      };
      const dailyToken: DailyTokenTrend = {
        date: "2024-01-01",
        prompt_tokens: 30000,
        completion_tokens: 20000,
        total_tokens: 50000,
        request_count: 100,
      };

      expect(userSpend.total_spend).toBe(50);
      expect(keySpend.total_tokens).toBe(10000);
      expect(dailySpend.spend).toBe(10);
      expect(modelDetail.model_name).toBe("gpt-4");
      expect(modelConfig.modelName).toBe("gpt-4");
      expect(modelStats.success_rate).toBe(0.99);
      expect(perf.avg_duration_ms).toBe(150);
      expect(tokenDist.input_output_ratio).toBe(1.5);
      expect(hourly.request_count).toBe(50);
      expect(keyAnalytics.request_count).toBe(100);
      expect(costEff.cost_per_1k_tokens).toBe(0.001);
      expect(modelDist.percentage).toBe(50);
      expect(dailyToken.total_tokens).toBe(50000);
    });
  });
});
