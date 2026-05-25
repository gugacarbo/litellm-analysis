import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { WeavePlugin } from "../plugin";

type AgentWithId = SystemAgent & { id: string };

function makeSystemAgent(
  id: string,
  overrides: Partial<SystemAgent> = {},
): AgentWithId {
  return {
    id,
    displayName: id,
    icon: "🔧",
    description: "",
    limits: { context: 200000, output: 32768 },
    model: "gpt-4",
    config: { temperature: 0.2, color: "#000000" },
    ...overrides,
  };
}

describe("WeavePlugin", () => {
  it("inclui agentes weave quando roteamento usa ids diferentes (pattern -> planner)", () => {
    const plugin = new WeavePlugin();
    const agents: AgentWithId[] = [
      makeSystemAgent("planner", { displayName: "Planner" }),
      makeSystemAgent("explorer", { displayName: "Explorer" }),
      makeSystemAgent("reviewer", { displayName: "Reviewer" }),
    ];
    const routing: PluginRouting = {
      enabled: true,
      outputFile: "weave-config.json",
      routing: {
        agents: {
          pattern: "planner",
          spindle: "explorer",
          weft: "reviewer",
        },
        categories: {},
      },
    };

    const output = plugin.buildOutput(agents, routing, {
      allModels: {},
      litellmConfig: { baseUrl: "", apiKey: "" },
    }) as {
      agents: Record<string, { display_name: string; model: string }>;
    };

    expect(output.agents.pattern?.display_name).toBe("Planner");
    expect(output.agents.spindle?.display_name).toBe("Explorer");
    expect(output.agents.weft?.display_name).toBe("Reviewer");
    expect(output.agents.weft?.model).toBe("reviewer/gpt-5.5");
  });
});
