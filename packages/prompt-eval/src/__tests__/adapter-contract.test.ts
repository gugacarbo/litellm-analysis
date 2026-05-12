import { describe, it, expect } from "vitest";
import type { PromptEvalAdapter } from "../types/index.js";
import { createPromptfooAdapter } from "../adapter/promptfoo.js";

function runAdapterContract(createAdapter: () => PromptEvalAdapter) {
  describe("PromptEvalAdapter contract", () => {
    it("classify returns predictedCategories array", async () => {
      const adapter = createAdapter();
      const result = await adapter.classify({
        categories: [{ id: "test", name: "Test", description: "A test category" }],
        prompt: "This is a test prompt",
        model: "test-model",
      });

      expect(Array.isArray(result.predictedCategories)).toBe(true);
      expect(typeof result.latencyMs).toBe("number");
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("classify predictedCategories are valid category IDs", async () => {
      const adapter = createAdapter();
      const categories = [
        { id: "cat_a", name: "A", description: "Category A" },
        { id: "cat_b", name: "B", description: "Category B" },
      ];

      const result = await adapter.classify({
        categories,
        prompt: "test prompt",
        model: "test-model",
      });

      for (const pred of result.predictedCategories) {
        expect(categories.some((c) => c.id === pred)).toBe(true);
      }
    });

    it("review returns findings and suggestions", async () => {
      const adapter = createAdapter();
      const result = await adapter.review({
        cases: [{
          caseId: "1",
          input: "test",
          expectedCategories: ["cat_a"],
          predictedCategories: ["cat_b"],
          categories: [
            { id: "cat_a", name: "A", description: "Category A" },
            { id: "cat_b", name: "B", description: "Category B" },
          ],
        }],
        model: "test-model",
      });

      expect(Array.isArray(result.findings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("classify respects AbortSignal", async () => {
      const adapter = createAdapter();
      const controller = new AbortController();
      controller.abort();

      await expect(
        adapter.classify({
          categories: [{ id: "test", name: "T", description: "D" }],
          prompt: "test",
          model: "test-model",
          signal: controller.signal,
        }),
      ).rejects.toThrow();
    });
  });
}

runAdapterContract(() => createPromptfooAdapter({ provider: "test-provider" }));
