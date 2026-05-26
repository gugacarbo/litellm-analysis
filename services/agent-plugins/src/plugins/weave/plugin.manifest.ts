import type { PluginManifest } from "../../sdk";
import {
  type WeavePluginConfig,
  weavePluginConfigSchema,
} from "./plugin.config";
import { weavePluginDefaults } from "./plugin.defaults";

export interface WeaveAgentOutput {
  display_name: string;
  model: string;
  fallback_models: string[];
  temperature: number;
  color: string;
  category?: string;
}

export interface WeaveCategoryOutput {
  description: string;
  model: string;
  fallback_models: string[];
  temperature: number;
}

export interface WeaveConfigOutput {
  $schema: string;
  log_level: string;
  tmux: { enabled: boolean };
  analytics: { enabled: boolean; use_fingerprint: boolean };
  continuation: {
    recovery: { compaction: boolean };
    idle: {
      enabled: boolean;
      work: boolean;
      workflow: boolean;
      todo_prompt: boolean;
    };
  };
  skill_directories: string[];
  agents: Record<string, WeaveAgentOutput>;
  categories: Record<string, WeaveCategoryOutput>;
}

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

export const weaveManifest: PluginManifest<
  "weave",
  WeavePluginConfig,
  WeaveConfigOutput
> = {
  id: "weave",
  displayName: "OpenCode Weave",
  version: 2,
  output: { fileName: "weave-config.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: true,
  },
  internalAgents: WEAVE_AGENTS.map((agent) => ({
    id: agent.id,
    displayName: agent.displayName,
    description: agent.description,
  })),
  configSchema: [
    {
      key: "$schema",
      type: "string",
      label: "Schema URL",
      required: false,
      default: weavePluginDefaults.$schema,
      placeholder: "weave config schema URL",
      description: "JSON Schema URL for the generated weave config",
    },
    {
      key: "logLevel",
      type: "select",
      label: "Log Level",
      required: false,
      default: weavePluginDefaults.logLevel,
      options: ["DEBUG", "INFO", "WARN", "ERROR"].map((value) => ({
        value,
        label: value,
      })),
      description: "Logging verbosity level for Weave",
    },
    {
      key: "tmuxEnabled",
      type: "boolean",
      label: "Tmux Enabled",
      required: false,
      default: weavePluginDefaults.tmuxEnabled,
      description: "Enable tmux session management",
    },
    {
      key: "analyticsEnabled",
      type: "boolean",
      label: "Analytics Enabled",
      required: false,
      default: weavePluginDefaults.analyticsEnabled,
      description: "Enable usage analytics collection",
    },
    {
      key: "analyticsUseFingerprint",
      type: "boolean",
      label: "Analytics Use Fingerprint",
      required: false,
      default: weavePluginDefaults.analyticsUseFingerprint,
      description: "Use fingerprint for analytics tracking",
    },
    {
      key: "continuationRecoveryCompaction",
      type: "boolean",
      label: "Continuation Recovery Compaction",
      required: false,
      default: weavePluginDefaults.continuationRecoveryCompaction,
      description: "Enable context compaction during recovery",
    },
    {
      key: "continuationIdleEnabled",
      type: "boolean",
      label: "Continuation Idle Enabled",
      required: false,
      default: weavePluginDefaults.continuationIdleEnabled,
      description: "Enable idle continuation processing",
    },
    {
      key: "continuationIdleWork",
      type: "boolean",
      label: "Continuation Idle Work",
      required: false,
      default: weavePluginDefaults.continuationIdleWork,
      description: "Allow work during idle periods",
    },
    {
      key: "continuationIdleTodoPrompt",
      type: "boolean",
      label: "Continuation Idle Todo Prompt",
      required: false,
      default: weavePluginDefaults.continuationIdleTodoPrompt,
      description: "Show todo prompt during idle",
    },
    {
      key: "permissionQuestion",
      type: "select",
      label: "Permission Question Behavior",
      required: false,
      default: weavePluginDefaults.permissionQuestion,
      options: [
        { value: "allow", label: "Allow" },
        { value: "deny", label: "Deny" },
        { value: "ask", label: "Ask" },
      ],
      description: "Default behavior for permission questions",
    },
    {
      key: "skillDirectories",
      type: "multiselect",
      label: "Skill Directories",
      required: false,
      default: [...weavePluginDefaults.skillDirectories],
      options: [
        { value: "~/.agents/skills", label: "~/.agents/skills" },
        { value: "~/.claude/skills", label: "~/.claude/skills" },
        { value: "~/.opencode/skills", label: "~/.opencode/skills" },
      ],
      description: "Directories to scan for skills",
    },
  ],
  configZodSchema: weavePluginConfigSchema,
};
