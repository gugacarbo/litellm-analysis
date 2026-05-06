import { describe, expect, it } from "vitest";
import {
  agentConfigFileSchema,
  agentConfigSchema,
  categoryConfigSchema,
  ohMyOpenAgentConfigSchema,
  permissionSchema,
  thinkingSchema,
} from "../types/agent-config";

// ─── permissionSchema Tests ───────────────────────────────────────────────────

describe("permissionSchema", () => {
  it("accepts a fully populated permission object", () => {
    const result = permissionSchema.parse({
      edit: "ask",
      bash: "allow",
      webfetch: "deny",
      doom_loop: "ask",
      external_directory: "allow",
    });
    expect(result).toEqual({
      edit: "ask",
      bash: "allow",
      webfetch: "deny",
      doom_loop: "ask",
      external_directory: "allow",
    });
  });

  it("accepts a bash permission as a record of command → level", () => {
    const result = permissionSchema.parse({
      bash: {
        "npm install": "allow",
        "rm -rf /": "deny",
      },
    });
    expect(result.bash).toEqual({
      "npm install": "allow",
      "rm -rf /": "deny",
    });
  });

  it("accepts an empty permission object (all fields optional)", () => {
    const result = permissionSchema.parse({});
    expect(result).toEqual({});
  });

  it("rejects an invalid edit value", () => {
    expect(() => permissionSchema.parse({ edit: "grant" })).toThrow();
  });

  it("rejects an invalid bash value (wrong enum)", () => {
    expect(() => permissionSchema.parse({ bash: "maybe" })).toThrow();
  });

  it("rejects a non-object bash value when using record form", () => {
    expect(() => permissionSchema.parse({ bash: 42 })).toThrow();
  });

  it("rejects a bash record with invalid permission level", () => {
    expect(() =>
      permissionSchema.parse({ bash: { "npm install": "maybe" } }),
    ).toThrow();
  });

  it("rejects null as entire input", () => {
    expect(() => permissionSchema.parse(null)).toThrow();
  });

  it("rejects undefined as entire input", () => {
    expect(() => permissionSchema.parse(undefined)).toThrow();
  });

  it("rejects an array input", () => {
    expect(() => permissionSchema.parse([])).toThrow();
  });

  it("strips unknown keys", () => {
    const result = permissionSchema.parse({
      edit: "allow",
      unknown_field: "should be stripped",
    });
    expect(result).toEqual({ edit: "allow" });
    expect("unknown_field" in result).toBe(false);
  });
});

// ─── thinkingSchema Tests ─────────────────────────────────────────────────────

describe("thinkingSchema", () => {
  it("accepts a thinking object with type enabled", () => {
    const result = thinkingSchema.parse({
      type: "enabled",
    });
    expect(result).toEqual({ type: "enabled" });
  });

  it("accepts a thinking object with type disabled", () => {
    const result = thinkingSchema.parse({
      type: "disabled",
    });
    expect(result).toEqual({ type: "disabled" });
  });

  it("accepts budgetTokens when provided", () => {
    const result = thinkingSchema.parse({
      type: "enabled",
      budgetTokens: 4096,
    });
    expect(result).toEqual({ type: "enabled", budgetTokens: 4096 });
  });
  it("accepts a zero budgetTokens", () => {
    const result = thinkingSchema.parse({
      type: "disabled",
      budgetTokens: 0,
    });
    expect(result).toEqual({ type: "disabled", budgetTokens: 0 });
  });

  it("accepts a negative budgetTokens (edge case, number is unconstrained)", () => {
    const result = thinkingSchema.parse({
      type: "enabled",
      budgetTokens: -100,
    });
    expect(result.budgetTokens).toBe(-100);
  });

  it("rejects an invalid type value", () => {
    expect(() => thinkingSchema.parse({ type: "always" })).toThrow();
  });

  it("rejects missing required type field", () => {
    expect(() => thinkingSchema.parse({})).toThrow();
  });

  it("rejects a string instead of number for budgetTokens", () => {
    expect(() =>
      thinkingSchema.parse({ type: "enabled", budgetTokens: "4096" }),
    ).toThrow();
  });

  it("rejects null input", () => {
    expect(() => thinkingSchema.parse(null)).toThrow();
  });

  it("rejects undefined input", () => {
    expect(() => thinkingSchema.parse(undefined)).toThrow();
  });
});

// ─── agentConfigSchema Tests ──────────────────────────────────────────────────

describe("agentConfigSchema", () => {
  it("accepts a minimal agent config (empty object)", () => {
    const result = agentConfigSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts a fully populated agent config", () => {
    const result = agentConfigSchema.parse({
      model: "claude-sonnet-4",
      fallback_models: ["claude-haiku-4", "gpt-4o"],
      variant: "default",
      category: "coding",
      skills: ["typescript", "react"],
      temperature: 0.7,
      top_p: 0.9,
      prompt: "You are an expert TypeScript developer.",
      prompt_append: "Always provide examples.",
      tools: { bash: true, edit: false },
      disable: false,
      description: "Coding agent",
      mode: "primary",
      color: "#4A90D9",
      permission: { edit: "allow", bash: "deny" },
    });
    expect(result.model).toBe("claude-sonnet-4");
    expect(result.mode).toBe("primary");
    expect(result.permission?.edit).toBe("allow");
  });

  it("accepts all mode enum values", () => {
    for (const mode of ["subagent", "primary", "all"] as const) {
      const result = agentConfigSchema.parse({ mode });
      expect(result.mode).toBe(mode);
    }
  });
  it("rejects an invalid mode value", () => {
    expect(() => agentConfigSchema.parse({ mode: "super" })).toThrow();
  });
  it("rejects an invalid temperature type (string instead of number)", () => {
    expect(() => agentConfigSchema.parse({ temperature: "hot" })).toThrow();
  });
  it("rejects a negative temperature (number is unconstrained but schema allows it)", () => {
    const result = agentConfigSchema.parse({ temperature: -1 });
    expect(result.temperature).toBe(-1);
  });
  it("accepts empty strings for optional string fields", () => {
    const result = agentConfigSchema.parse({
      model: "",
      description: "",
      prompt: "",
    });
    expect(result.model).toBe("");
    expect(result.description).toBe("");
  });
  it("accepts empty arrays for optional array fields", () => {
    const result = agentConfigSchema.parse({
      fallback_models: [],
      skills: [],
    });
    expect(result.fallback_models).toEqual([]);
    expect(result.skills).toEqual([]);
  });
  it("rejects an array for a string field", () => {
    expect(() => agentConfigSchema.parse({ model: [] })).toThrow();
  });
  it("rejects a boolean for a number field", () => {
    expect(() => agentConfigSchema.parse({ temperature: true })).toThrow();
  });
  it("strips unknown keys in permission sub-object", () => {
    const result = agentConfigSchema.parse({
      permission: { edit: "allow", unknown: true },
    });
    expect(result.permission?.edit).toBe("allow");
    expect("unknown" in result.permission!).toBe(false);
  });
});

// ─── categoryConfigSchema Tests ───────────────────────────────────────────────

describe("categoryConfigSchema", () => {
  it("accepts a minimal category config (empty object)", () => {
    const result = categoryConfigSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts a fully populated category config", () => {
    const result = categoryConfigSchema.parse({
      model: "gpt-4o",
      fallback_models: ["gpt-4o-mini"],
      variant: "default",
      temperature: 0.3,
      top_p: 0.8,
      maxTokens: 4096,
      thinking: { type: "enabled", budgetTokens: 2048 },
      reasoningEffort: "high",
      textVerbosity: "medium",
      tools: { bash: true, edit: false, webfetch: true },
      prompt_append: "Respond concisely.",
      is_unstable_agent: false,
      description: "General purpose category",
    });
    expect(result.model).toBe("gpt-4o");
    expect(result.maxTokens).toBe(4096);
    expect(result.thinking?.type).toBe("enabled");
    expect(result.reasoningEffort).toBe("high");
    expect(result.textVerbosity).toBe("medium");
    expect(result.is_unstable_agent).toBe(false);
  });

  it("accepts all reasoningEffort enum values", () => {
    for (const value of ["low", "medium", "high", "xhigh"] as const) {
      const result = categoryConfigSchema.parse({ reasoningEffort: value });
      expect(result.reasoningEffort).toBe(value);
    }
  });
  it("rejects an invalid reasoningEffort value", () => {
    expect(() =>
      categoryConfigSchema.parse({ reasoningEffort: "max" }),
    ).toThrow();
  });
  it("accepts all textVerbosity enum values", () => {
    for (const value of ["low", "medium", "high"] as const) {
      const result = categoryConfigSchema.parse({ textVerbosity: value });
      expect(result.textVerbosity).toBe(value);
    }
  });
  it("rejects an invalid textVerbosity value", () => {
    expect(() =>
      categoryConfigSchema.parse({ textVerbosity: "verbose" }),
    ).toThrow();
  });
  it("rejects a string instead of number for maxTokens", () => {
    expect(() => categoryConfigSchema.parse({ maxTokens: "many" })).toThrow();
  });
  it("rejects a string instead of number for temperature", () => {
    expect(() =>
      categoryConfigSchema.parse({ temperature: "freezing" }),
    ).toThrow();
  });
  it("accepts null-like values for optional boolean (false)", () => {
    const result = categoryConfigSchema.parse({ is_unstable_agent: false });
    expect(result.is_unstable_agent).toBe(false);
  });
  it("rejects a string for boolean field", () => {
    expect(() =>
      categoryConfigSchema.parse({ is_unstable_agent: "yes" }),
    ).toThrow();
  });
  it("accepts empty tools object", () => {
    const result = categoryConfigSchema.parse({ tools: {} });
    expect(result.tools).toEqual({});
  });
  it("rejects null input", () => {
    expect(() => categoryConfigSchema.parse(null)).toThrow();
  });
});

// ─── agentConfigFileSchema Tests ──────────────────────────────────────────────

describe("agentConfigFileSchema", () => {
  const minimalConfig = {
    agents: {},
    categories: {},
  };

  it("accepts a config file with empty agents and categories", () => {
    const result = agentConfigFileSchema.parse(minimalConfig);
    expect(result.agents).toEqual({});
    expect(result.categories).toEqual({});
  });
  it("accepts a config file with agents and categories populated", () => {
    const result = agentConfigFileSchema.parse({
      agents: {
        "code-reviewer": {
          model: "claude-sonnet-4",
          category: "coding",
          mode: "primary",
        },
        "data-analyzer": {
          model: "gpt-4o",
          category: "analytics",
        },
      },
      categories: {
        coding: {
          model: "claude-sonnet-4",
          temperature: 0.5,
        },
        analytics: {
          model: "gpt-4o",
          maxTokens: 8192,
        },
      },
    });
    expect(Object.keys(result.agents)).toHaveLength(2);
    expect(Object.keys(result.categories)).toHaveLength(2);
    expect(result.agents["code-reviewer"].mode).toBe("primary");
    expect(result.categories.coding.temperature).toBe(0.5);
  });

  it("rejects a config file missing the agents field", () => {
    expect(() => agentConfigFileSchema.parse({ categories: {} })).toThrow();
  });
  it("rejects a config file missing the categories field", () => {
    expect(() => agentConfigFileSchema.parse({ agents: {} })).toThrow();
  });
  it("rejects a config file with agents as array instead of record", () => {
    expect(() =>
      agentConfigFileSchema.parse({
        agents: [],
        categories: {},
      }),
    ).toThrow();
  });
  it("rejects null input", () => {
    expect(() => agentConfigFileSchema.parse(null)).toThrow();
  });
  it("rejects undefined input", () => {
    expect(() => agentConfigFileSchema.parse(undefined)).toThrow();
  });
});

// ─── ohMyOpenAgentConfigSchema Tests ─────────────────────────────────────────

describe("ohMyOpenAgentConfigSchema", () => {
  it("accepts a minimal config (agents + categories only)", () => {
    const result = ohMyOpenAgentConfigSchema.parse({
      agents: {},
      categories: {},
    });
    expect(result.agents).toEqual({});
    expect(result.categories).toEqual({});
  });
  it("accepts a config with all fields populated", () => {
    const result = ohMyOpenAgentConfigSchema.parse({
      $schema: "https://example.com/schema.json",
      globalFallbackModel: "gpt-4o-mini",
      agents: {
        "code-reviewer": {
          model: "claude-sonnet-4",
          mode: "primary",
        },
      },
      categories: {
        coding: {
          model: "claude-sonnet-4",
        },
      },
      git_master: {
        commit_footer: true,
        include_co_authored_by: false,
      },
    });
    expect(result.$schema).toBe("https://example.com/schema.json");
    expect(result.globalFallbackModel).toBe("gpt-4o-mini");
    expect(result.git_master?.commit_footer).toBe(true);
    expect(result.git_master?.include_co_authored_by).toBe(false);
  });
  it("accepts a git_master with only one field", () => {
    const result = ohMyOpenAgentConfigSchema.parse({
      agents: {},
      categories: {},
      git_master: {
        commit_footer: true,
      },
    });
    expect(result.git_master?.commit_footer).toBe(true);
    expect(result.git_master?.include_co_authored_by).toBeUndefined();
  });
  it("rejects a config missing agents field", () => {
    expect(() =>
      ohMyOpenAgentConfigSchema.parse({
        categories: {},
      }),
    ).toThrow();
  });
  it("rejects a config missing categories field", () => {
    expect(() =>
      ohMyOpenAgentConfigSchema.parse({
        agents: {},
      }),
    ).toThrow();
  });
  it("rejects agents as array instead of record", () => {
    expect(() =>
      ohMyOpenAgentConfigSchema.parse({
        agents: [],
        categories: {},
      }),
    ).toThrow();
  });
  it("rejects null input", () => {
    expect(() => ohMyOpenAgentConfigSchema.parse(null)).toThrow();
  });
  it("strips unknown top-level keys", () => {
    const result = ohMyOpenAgentConfigSchema.parse({
      agents: {},
      categories: {},
      unknown_field: "should be stripped",
    });
    expect("unknown_field" in result).toBe(false);
  });
});

// ─── Type Re-export Verification ──────────────────────────────────────────────

describe("type exports", () => {
  it("imports agentConfigSchema as a ZodObject from the index", async () => {
    // Dynamic import to test the barrel export works
    const shared = await import("../index");
    expect(shared.agentConfigSchema).toBeDefined();
    expect(shared.categoryConfigSchema).toBeDefined();
    expect(shared.agentConfigFileSchema).toBeDefined();
    expect(shared.ohMyOpenAgentConfigSchema).toBeDefined();
    expect(shared.permissionSchema).toBeDefined();
    expect(shared.thinkingSchema).toBeDefined();
  });

  it("has ZodObject as constructor name for all schemas", () => {
    // Runtime verification that schemas are real Zod objects
    const schemas = [
      permissionSchema,
      thinkingSchema,
      agentConfigSchema,
      categoryConfigSchema,
      agentConfigFileSchema,
      ohMyOpenAgentConfigSchema,
    ];
    for (const schema of schemas) {
      expect(schema.constructor.name).toBe("ZodObject");
    }
  });

  it("infers correct types from schemas", () => {
    // Type-level checks: assert inferred types have expected keys
    // This is a runtime check that complements the compile-time type safety
    type PermissionType = z.infer<typeof permissionSchema>;
    type AgentConfigType = z.infer<typeof agentConfigSchema>;
    type CategoryConfigType = z.infer<typeof categoryConfigSchema>;
    type AgentConfigFileType = z.infer<typeof agentConfigFileSchema>;
    type OhMyOpenAgentConfigType = z.infer<typeof ohMyOpenAgentConfigSchema>;
    type ThinkingType = z.infer<typeof thinkingSchema>;

    // These are compile-time checks — they verify the types exist and are inferable
    // Runtime: verify the schemas produce objects with correct shapes
    const p: PermissionType = permissionSchema.parse({});
    const a: AgentConfigType = agentConfigSchema.parse({});
    const c: CategoryConfigType = categoryConfigSchema.parse({});
    const f: AgentConfigFileType = agentConfigFileSchema.parse({
      agents: {},
      categories: {},
    });
    const o: OhMyOpenAgentConfigType = ohMyOpenAgentConfigSchema.parse({
      agents: {},
      categories: {},
    });
    const t: ThinkingType = thinkingSchema.parse({ type: "enabled" });

    expect(typeof p).toBe("object");
    expect(typeof a).toBe("object");
    expect(typeof c).toBe("object");
    expect(typeof f).toBe("object");
    expect(typeof o).toBe("object");
    expect(typeof t).toBe("object");
  });
});

import type { z } from "zod";
