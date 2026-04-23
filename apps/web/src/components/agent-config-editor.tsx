'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AgentConfig } from '../types/agent-routing';
import { AgentConfigEditorAdvancedSections } from './agent-config-editor/agent-config-editor-advanced-sections';
import { AgentConfigEditorPrimarySections } from './agent-config-editor/agent-config-editor-primary-sections';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface AgentConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  initialConfig?: AgentConfig;
  onSave: (config: AgentConfig) => Promise<void>;
  onReset: () => Promise<void>;
  saving?: boolean;
  error?: string | null;
}

function normalizeAgentConfig(initialConfig: AgentConfig = {}): AgentConfig {
  return {
    model: initialConfig.model || '',
    fallback_models: initialConfig.fallback_models || [],
    variant: initialConfig.variant || '',
    category: initialConfig.category || '',
    skills: initialConfig.skills || [],
    temperature: initialConfig.temperature,
    top_p: initialConfig.top_p,
    prompt: initialConfig.prompt || '',
    prompt_append: initialConfig.prompt_append || '',
    tools: initialConfig.tools || {},
    disable: initialConfig.disable || false,
    description: initialConfig.description || '',
    mode: initialConfig.mode || 'subagent',
    color: initialConfig.color || '',
    permission: initialConfig.permission || {},
  };
}

export function AgentConfigEditor({
  open,
  onOpenChange,
  agentKey,
  initialConfig = {},
  onSave,
  onReset,
  saving = false,
  error,
}: AgentConfigEditorProps) {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [config, setConfig] = useState<AgentConfig>(() =>
    normalizeAgentConfig(initialConfig),
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    model: false,
    prompts: false,
    execution: false,
    meta: false,
    permissions: false,
  });
  const [newSkill, setNewSkill] = useState('');
  const [newToolKey, setNewToolKey] = useState('');
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
    updateConfig('skills', [...(config.skills || []), newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    const newSkills = [...(config.skills || [])];
    newSkills.splice(index, 1);
    updateConfig('skills', newSkills);
  };

  const addTool = () => {
    if (!newToolKey.trim()) return;

    updateConfig('tools', {
      ...(config.tools || {}),
      [newToolKey.trim()]: newToolValue,
    });
    setNewToolKey('');
  };

  const removeTool = (key: string) => {
    const newTools = { ...(config.tools || {}) };
    delete newTools[key];
    updateConfig('tools', newTools);
  };

  const updateToolValue = (key: string, value: boolean) => {
    updateConfig('tools', {
      ...(config.tools || {}),
      [key]: value,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    await onSave(config);
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      onOpenChange(false);
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
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

        <div className="grid gap-6 py-4">
          <AgentConfigEditorPrimarySections
            agentKey={agentKey}
            config={config}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onUpdateConfig={updateConfig}
          />

          <AgentConfigEditorAdvancedSections
            config={config}
            expandedSections={expandedSections}
            newSkill={newSkill}
            newToolKey={newToolKey}
            newToolValue={newToolValue}
            onToggleSection={toggleSection}
            onUpdateConfig={updateConfig}
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

        <DialogFooter>
          {resetConfirm ? (
            <>
              <span className="text-sm text-muted-foreground me-2">
                Remove configuration for this agent?
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetConfirm(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin me-1" />
                    Resetting...
                  </>
                ) : (
                  'Confirm Reset'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setResetConfirm(true)}
              >
                Reset to default
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
