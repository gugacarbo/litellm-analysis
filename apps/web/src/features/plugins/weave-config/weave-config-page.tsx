import type { ConfigField } from "@lite-llm/contracts/agent-catalog";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { SystemAgentOption } from "@/shared/lib/api-client/agent-catalog";

// ── Weave agent metadata (synced with plugin.ts) ──

interface WeaveAgentMeta {
  id: string;
  displayName: string;
  description: string;
  color: string;
  category: string;
}

const WEAVE_AGENTS: WeaveAgentMeta[] = [
  {
    id: "loom",
    displayName: "Loom (Orquestrador Principal)",
    description:
      "Main orchestrator — primary user-facing interface that understands requests, routes work, and coordinates results",
    color: "#4A90D9",
    category: "deep",
  },
  {
    id: "tapestry",
    displayName: "Tapestry (Orquestrador de Execução)",
    description:
      "Plan execution orchestrator — delegates plan tasks to Shuttle, verifies results, and tracks progress",
    color: "#D94A4A",
    category: "deep",
  },
  {
    id: "pattern",
    displayName: "Pattern (Planejador Estratégico)",
    description: "Strategic planner — produces .weave/plans/ files",
    color: "#9B59B6",
    category: "deep",
  },
  {
    id: "shuttle",
    displayName: "Shuttle (Especialista de Domínio)",
    description:
      "Domain specialist worker — handles delegated implementation and analysis tasks",
    color: "#E67E22",
    category: "deep",
  },
  {
    id: "thread",
    displayName: "Thread (Explorador de Código)",
    description: "Codebase explorer — fast, read-only analysis and search",
    color: "#27AE60",
    category: "quick",
  },
  {
    id: "spindle",
    displayName: "Spindle (Pesquisador Externo)",
    description: "External researcher — web fetching and research",
    color: "#F39C12",
    category: "quick",
  },
  {
    id: "weft",
    displayName: "Weft (Revisor de Qualidade)",
    description: "Quality reviewer and auditor",
    color: "#1ABC9C",
    category: "deep",
  },
  {
    id: "warp",
    displayName: "Warp (Auditor de Segurança)",
    description: "Security auditor",
    color: "#E74C3C",
    category: "deep",
  },
];

const WEAVE_CATEGORIES = [
  {
    id: "deep",
    label: "Deep",
    description: "Autonomous goal-oriented problem solving.",
  },
  {
    id: "quick",
    label: "Quick",
    description: "Fast handling for small and low-complexity tasks.",
  },
  {
    id: "visual-engineering",
    label: "Visual Engineering",
    description: "Frontend, UI/UX, styling, and visual implementation.",
  },
  {
    id: "writing",
    label: "Writing",
    description: "Technical writing, documentation, and clear communication.",
  },
];

// ── Props ──

interface WeaveConfigPageProps {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  schema: ConfigField[];
  agentMappings: Record<string, string>;
  categoryMappings: Record<string, boolean>;
  systemAgents: SystemAgentOption[];
  onAgentMappingChange: (
    internalAgentId: string,
    systemAgentKey: string,
  ) => void;
  onCategoryToggle: (categoryId: string) => void;
}

export function WeaveConfigPage({
  config,
  onChange,
  agentMappings,
  categoryMappings,
  systemAgents,
  onAgentMappingChange,
  onCategoryToggle,
}: WeaveConfigPageProps) {
  const [copied, setCopied] = useState(false);

  // ── Config values ──
  const schemaUrl = (config.$schema as string) ?? "";
  const logLevel = (config.logLevel as string) ?? "INFO";
  const tmuxEnabled = (config.tmuxEnabled as boolean) ?? true;
  const analyticsEnabled = (config.analyticsEnabled as boolean) ?? true;
  const analyticsFingerprint =
    (config.analyticsUseFingerprint as boolean) ?? true;
  const recoveryCompaction =
    (config.continuationRecoveryCompaction as boolean) ?? true;
  const idleEnabled = (config.continuationIdleEnabled as boolean) ?? true;
  const idleWork = (config.continuationIdleWork as boolean) ?? true;
  const idleTodoPrompt = (config.continuationIdleTodoPrompt as boolean) ?? true;
  const permissionQuestion = (config.permissionQuestion as string) ?? "allow";
  const skillDirs = (config.skillDirectories as string[]) ?? [
    "~/.agents/skills",
    "~/.claude/skills",
    "~/.opencode/skills",
  ];

  // ── Preview JSON ──
  const previewJson = useMemo(() => {
    const agents: Record<string, unknown> = {};
    for (const wa of WEAVE_AGENTS) {
      const systemAgentKey = agentMappings[wa.id];
      const sysAgent = systemAgents.find((a) => a.key === systemAgentKey);
      agents[wa.id] = {
        display_name: sysAgent?.displayName ?? wa.displayName,
        model: sysAgent?.key ?? "",
        fallback_models: [],
        temperature: 0.2,
        color: wa.color,
        category: wa.category,
      };
    }

    const cats: Record<string, unknown> = {};
    for (const wc of WEAVE_CATEGORIES) {
      const enabled = categoryMappings[wc.id] ?? false;
      if (!enabled) continue;
      cats[wc.id] = {
        description: wc.description,
        model: "",
        fallback_models: [],
        temperature: 0.2,
      };
    }

    return {
      $schema:
        schemaUrl ||
        "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json",
      log_level: logLevel,
      tmux: { enabled: tmuxEnabled },
      analytics: {
        enabled: analyticsEnabled,
        use_fingerprint: analyticsFingerprint,
      },
      continuation: {
        recovery: { compaction: recoveryCompaction },
        idle: {
          enabled: idleEnabled,
          work: idleWork,
          workflow: true,
          todo_prompt: idleTodoPrompt,
        },
      },
      permission: { question: permissionQuestion },
      skill_directories: skillDirs,
      agents,
      categories: cats,
    };
  }, [
    schemaUrl,
    logLevel,
    tmuxEnabled,
    analyticsEnabled,
    analyticsFingerprint,
    recoveryCompaction,
    idleEnabled,
    idleWork,
    idleTodoPrompt,
    permissionQuestion,
    skillDirs,
    agentMappings,
    categoryMappings,
    systemAgents,
  ]);

  const previewText = JSON.stringify(previewJson, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(previewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [previewText]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-lg font-medium">Schema</h3>
              <p className="text-sm text-muted-foreground">
                OpenCode Weave config schema URL for validation.
              </p>
              <div className="flex gap-2">
                <Input
                  value={schemaUrl}
                  onChange={(e) => onChange("$schema", e.target.value)}
                  placeholder="weave config schema URL"
                  className="font-mono text-xs"
                />
                <a
                  href={
                    schemaUrl ||
                    "/home/gustavo/Apps/opencode-weave/schema/weave-config.schema.json"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-medium">General Settings</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select
                    value={logLevel}
                    onValueChange={(v) => onChange("logLevel", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["DEBUG", "INFO", "WARN", "ERROR"].map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permission Question Behavior</Label>
                  <Select
                    value={permissionQuestion}
                    onValueChange={(v) => onChange("permissionQuestion", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="deny">Deny</SelectItem>
                      <SelectItem value="ask">Ask</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div>
                  <Label className="text-sm font-medium">Tmux</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable tmux session management
                  </p>
                </div>
                <Switch
                  checked={tmuxEnabled}
                  onCheckedChange={(v) => onChange("tmuxEnabled", v)}
                />
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-sm font-medium">Analytics</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enabled</span>
                  <Switch
                    checked={analyticsEnabled}
                    onCheckedChange={(v) => onChange("analyticsEnabled", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Use Fingerprint
                  </span>
                  <Switch
                    checked={analyticsFingerprint}
                    onCheckedChange={(v) =>
                      onChange("analyticsUseFingerprint", v)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-sm font-medium">Continuation</Label>
                <div className="ml-2 space-y-2 border-l-2 border-muted pl-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Recovery
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Compaction
                      </span>
                      <Switch
                        checked={recoveryCompaction}
                        onCheckedChange={(v) =>
                          onChange("continuationRecoveryCompaction", v)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Idle
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Enabled
                      </span>
                      <Switch
                        checked={idleEnabled}
                        onCheckedChange={(v) =>
                          onChange("continuationIdleEnabled", v)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Work
                      </span>
                      <Switch
                        checked={idleWork}
                        onCheckedChange={(v) =>
                          onChange("continuationIdleWork", v)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Todo Prompt
                      </span>
                      <Switch
                        checked={idleTodoPrompt}
                        onCheckedChange={(v) =>
                          onChange("continuationIdleTodoPrompt", v)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label className="text-sm font-medium">Skill Directories</Label>
                <p className="text-xs text-muted-foreground">
                  Directories to scan for skills
                </p>
                {[
                  "~/.agents/skills",
                  "~/.claude/skills",
                  "~/.opencode/skills",
                ].map((dir) => {
                  const checked = skillDirs.includes(dir);
                  return (
                    <div
                      key={dir}
                      className="flex items-center justify-between"
                    >
                      <code className="text-xs">{dir}</code>
                      <Switch
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = v
                            ? [...skillDirs, dir]
                            : skillDirs.filter((d: string) => d !== dir);
                          onChange("skillDirectories", next);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Agent Routing</h3>
            <p className="text-sm text-muted-foreground">
              Map system agents to Weave's internal agent roles. Each Weave
              agent has a specific role and category.
            </p>

            <div className="space-y-2">
              {WEAVE_AGENTS.map((wa) => {
                const selectedSystemKey = agentMappings[wa.id] ?? "";
                return (
                  <div
                    key={wa.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2.5"
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: wa.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {wa.displayName}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {wa.category}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {wa.description}
                      </p>
                    </div>
                    <Select
                      value={selectedSystemKey || "__none"}
                      onValueChange={(v) =>
                        onAgentMappingChange(wa.id, v === "__none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-52 shrink-0">
                        <SelectValue placeholder="Select agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                        {systemAgents.map((sa) => (
                          <SelectItem key={sa.key} value={sa.key}>
                            {sa.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="categories">
          <section className="space-y-4">
            <h3 className="text-lg font-medium">Categories</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable task categories for export to Weave config.
            </p>

            <div className="space-y-2 rounded-md border p-3">
              {WEAVE_CATEGORIES.map((wc) => {
                const enabled = categoryMappings[wc.id] ?? false;
                return (
                  <div
                    key={wc.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">{wc.label}</span>
                      <p className="text-xs text-muted-foreground">
                        {wc.description}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => onCategoryToggle(wc.id)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="preview">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-medium">Output Preview</h3>
                <p className="text-sm text-muted-foreground">
                  JSON preview of the generated Weave config.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="rounded-md border bg-muted/20">
              <pre className="max-h-130 overflow-auto p-4 text-xs font-mono">
                {previewText}
              </pre>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
