import { describe, expect, it } from "vitest";
import { validateDataset } from "../dataset";
import type { CategoryDefinition, CategoryEvalDataset } from "../types/index";

const categories: CategoryDefinition[] = [
  { id: "cat_a", name: "Category A", description: "desc a" },
  { id: "cat_b", name: "Category B", description: "desc b" },
];

describe("validateDataset", () => {
  it("returns valid for a correct dataset", () => {
    const dataset: CategoryEvalDataset = {
      version: 1,
      description: "test",
      cases: [
        { id: "1", input: "hello", expectedCategories: ["cat_a"] },
        { id: "2", input: "world", expectedCategories: ["cat_a", "cat_b"] },
      ],
    };
    const result = validateDataset(dataset, categories);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty cases", () => {
    const dataset: CategoryEvalDataset = {
      version: 1,
      description: "test",
      cases: [],
    };
    const result = validateDataset(dataset, categories);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Dataset must have at least one case");
  });

  it("rejects unknown category IDs", () => {
    const dataset: CategoryEvalDataset = {
      version: 1,
      description: "test",
      cases: [{ id: "1", input: "hello", expectedCategories: ["cat_unknown"] }],
    };
    const result = validateDataset(dataset, categories);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cat_unknown"))).toBe(true);
  });

  it("rejects duplicate case IDs", () => {
    const dataset: CategoryEvalDataset = {
      version: 1,
      description: "test",
      cases: [
        { id: "1", input: "hello", expectedCategories: ["cat_a"] },
        { id: "1", input: "world", expectedCategories: ["cat_b"] },
      ],
    };
    const result = validateDataset(dataset, categories);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
  });

  it("rejects cases with empty expectedCategories", () => {
    const dataset: CategoryEvalDataset = {
      version: 1,
      description: "test",
      cases: [{ id: "1", input: "hello", expectedCategories: [] }],
    };
    const result = validateDataset(dataset, categories);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("empty"))).toBe(true);
  });
});
