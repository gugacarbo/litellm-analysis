import type { PluginManifest } from "../../sdk";

export const WEAVE_AGENTS: {
  id: string;
  displayName: string;
  description: string;
  color: string;
  category: string;
}[] = [
  {
    id: "loom",
    displayName: "Loom",
    description:
      "Main orchestrator - primary user-facing interface that understands requests, routes work, and coordinates results",
    color: "#4A90D9",
    category: "deep",
  },
  {
    id: "tapestry",
    displayName: "Tapestry",
    description:
      "Plan execution orchestrator - delegates plan tasks to Shuttle, verifies results, and tracks progress",
    color: "#D94A4A",
    category: "deep",
  },
  {
    id: "pattern",
    displayName: "Pattern",
    description: "Strategic planner - produces .weave/plans/ files",
    color: "#9B59B6",
    category: "deep",
  },
  {
    id: "shuttle",
    displayName: "Shuttle",
    description:
      "Domain specialist worker - handles delegated implementation and analysis tasks",
    color: "#E67E22",
    category: "deep",
  },
  {
    id: "thread",
    displayName: "Thread",
    description: "Codebase explorer - fast, read-only analysis and search",
    color: "#27AE60",
    category: "quick",
  },
  {
    id: "spindle",
    displayName: "Spindle",
    description: "External researcher - web fetching and research",
    color: "#F39C12",
    category: "quick",
  },
  {
    id: "weft",
    displayName: "Weft",
    description: "Quality reviewer and auditor",
    color: "#1ABC9C",
    category: "deep",
  },
  {
    id: "warp",
    displayName: "Warp",
    description: "Security auditor",
    color: "#E74C3C",
    category: "deep",
  },
];

export const weaveManifest: PluginManifest<"weave"> = {
  id: "weave",
  displayName: "OpenCode Weave",
  version: 2,
  output: { fileName: "weave-config.json" },
  $schema: "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json",
  internalAgents: WEAVE_AGENTS.map((agent) => ({
    id: agent.id,
    displayName: agent.displayName,
    description: agent.description,
  })),
};
