"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentConfig } from "../types/agent-routing";
import { AgentConfigEditorExecutionSection } from "./agent-config-editor/agent-config-editor-execution-section";
import { AgentConfigEditorPermissionsSection } from "./agent-config-editor/agent-config-editor-permissions-section";
import {
  AgentConfigEditorBasicSection,
  AgentConfigEditorModelSection,
  AgentConfigEditorPromptsSection,
} from "./agent-config-editor/agent-config-editor-primary-sections";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface AgentConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  initialConfig?: AgentConfig;
  onSave: (config: AgentConfig) => Promise<void>;
  saving?: boolean;
  error?: string | null;
}

type AgentEditorTab =
  | "overview"
  | "model"
  | "prompts"
  | "execution"
  | "permissions";

function normalizeAgentConfig(initialConfig: AgentConfig = {}): AgentConfig {
  return {
    model: initialConfig.model || "",
    fallback_models: initialConfig.fallback_models || [],
    variant: initialConfig.variant || "",
    category: initialConfig.category || "",
    skills: initialConfig.skills || [],
    temperature: initialConfig.temperature,
    top_p: initialConfig.top_p,
    prompt: initialConfig.prompt || "",
    prompt_append: initialConfig.prompt_append || "",
    tools: initialConfig.tools || {},
    disable: initialConfig.disable || false,
    description: initialConfig.description || "",
    mode: initialConfig.mode || "subagent",
    color: initialConfig.color || "",
    permission: initialConfig.permission || {},
  };
}

export function AgentConfigEditor({
  open,
  onOpenChange,
  agentKey,
  initialConfig = {},
  onSave,
  saving = false,
  error,
}: AgentConfigEditorProps) {
  const [activeTab, setActiveTab] = useState<AgentEditorTab>("overview");
  const [config, setConfig] = useState<AgentConfig>(() =>
    normalizeAgentConfig(initialConfig),
  );
  const [newSkill, setNewSkill] = useState("");
  const [newToolKey, setNewToolKey] = useState("");
  const [newToolValue, setNewToolValue] = useState(true);

  useEffect(() => {
    const normalized = normalizeAgentConfig(initialConfig);
    setConfig((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(normalized)) {
        return normalized;
      }
      return prev;
    });
  }, [initialConfig]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
  }, [open]);

  const updateConfig = <K extends keyof AgentConfig>(
    field: K,
    value: AgentConfig[K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    updateConfig("skills", [...(config.skills || []), newSkill.trim()]);
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    const newSkills = [...(config.skills || [])];
    newSkills.splice(index, 1);
    updateConfig("skills", newSkills);
  };

  const addTool = () => {
    if (!newToolKey.trim()) return;

    updateConfig("tools", {
      ...(config.tools || {}),
      [newToolKey.trim()]: newToolValue,
    });
    setNewToolKey("");
  };

  const removeTool = (key: string) => {
    const newTools = { ...(config.tools || {}) };
    delete newTools[key];
    updateConfig("tools", newTools);
  };

  const updateToolValue = (key: string, value: boolean) => {
    updateConfig("tools", {
      ...(config.tools || {}),
      [key]: value,
    });
  };

  const handleSave = async () => {
    await onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent Configuration: {agentKey}</DialogTitle>
          <DialogDescription className="sr-only">
            Edit configuration for {agentKey} agent
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
            {error}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as AgentEditorTab)}
          className="py-4"
        >
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start rounded-xl bg-muted/35 p-1"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <AgentConfigEditorBasicSection
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <AgentConfigEditorModelSection
                agentKey={agentKey}
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <AgentConfigEditorPromptsSection
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="execution" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <AgentConfigEditorExecutionSection
                config={config}
                newSkill={newSkill}
                newToolKey={newToolKey}
                newToolValue={newToolValue}
                onNewSkillChange={setNewSkill}
                onNewToolKeyChange={setNewToolKey}
                onNewToolValueChange={setNewToolValue}
                onAddSkill={addSkill}
                onRemoveSkill={removeSkill}
                onAddTool={addTool}
                onRemoveTool={removeTool}
                onUpdateToolValue={updateToolValue}
              />
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <AgentConfigEditorPermissionsSection
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin me-2" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
