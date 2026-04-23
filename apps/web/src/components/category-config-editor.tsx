'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CategoryConfig } from '../types/agent-routing';
import { Button } from './button';
import { CategoryConfigEditorAdvancedSection } from './category-config-editor/category-config-editor-advanced-section';
import { CategoryConfigEditorExecutionSection } from './category-config-editor/category-config-editor-execution-section';
import { CategoryConfigEditorPrimarySections } from './category-config-editor/category-config-editor-primary-sections';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Separator } from './separator';

interface CategoryConfigEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryKey: string;
  initialConfig?: CategoryConfig;
  onSave: (config: CategoryConfig) => Promise<void>;
  onReset: () => Promise<void>;
  saving?: boolean;
  error?: string | null;
}

function normalizeCategoryConfig(
  initialConfig: CategoryConfig = {},
): CategoryConfig {
  return {
    model: initialConfig.model || '',
    fallback_models: initialConfig.fallback_models || [],
    variant: initialConfig.variant || '',
    temperature: initialConfig.temperature,
    top_p: initialConfig.top_p,
    maxTokens: initialConfig.maxTokens,
    thinking: initialConfig.thinking || { type: 'enabled' },
    reasoningEffort: initialConfig.reasoningEffort,
    textVerbosity: initialConfig.textVerbosity,
    tools: initialConfig.tools || {},
    prompt_append: initialConfig.prompt_append || '',
    is_unstable_agent: initialConfig.is_unstable_agent || false,
    description: initialConfig.description || '',
  };
}

export function CategoryConfigEditor({
  open,
  onOpenChange,
  categoryKey,
  initialConfig = {},
  onSave,
  onReset,
  saving = false,
  error,
}: CategoryConfigEditorProps) {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [config, setConfig] = useState<CategoryConfig>(() =>
    normalizeCategoryConfig(initialConfig),
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    basic: true,
    model: false,
    advanced: false,
    execution: false,
    meta: false,
  });
  const [newToolKey, setNewToolKey] = useState('');
  const [newToolValue, setNewToolValue] = useState(true);

  useEffect(() => {
    const normalized = normalizeCategoryConfig(initialConfig);
    setConfig((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(normalized)) {
        return normalized;
      }
      return prev;
    });
  }, [initialConfig]);

  const updateConfig = <K extends keyof CategoryConfig>(
    field: K,
    value: CategoryConfig[K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateThinkingConfig = <
    K extends keyof NonNullable<CategoryConfig['thinking']>,
  >(
    field: K,
    value: NonNullable<CategoryConfig['thinking']>[K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      thinking: {
        ...(prev.thinking || { type: 'enabled' }),
        [field]: value,
      },
    }));
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
          <DialogTitle>Edit Category Configuration: {categoryKey}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 py-4">
          <CategoryConfigEditorPrimarySections
            categoryKey={categoryKey}
            config={config}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onUpdateConfig={updateConfig}
          />

          <Separator />

          <CategoryConfigEditorAdvancedSection
            config={config}
            expanded={expandedSections.advanced}
            onToggle={() => toggleSection('advanced')}
            onUpdateConfig={updateConfig}
            onUpdateThinkingConfig={updateThinkingConfig}
          />

          <Separator />

          <CategoryConfigEditorExecutionSection
            config={config}
            expandedSections={expandedSections}
            newToolKey={newToolKey}
            newToolValue={newToolValue}
            onToggleSection={toggleSection}
            onUpdateConfig={updateConfig}
            onNewToolKeyChange={setNewToolKey}
            onNewToolValueChange={setNewToolValue}
            onAddTool={addTool}
            onRemoveTool={removeTool}
            onUpdateToolValue={updateToolValue}
          />
        </div>

        <DialogFooter>
          {resetConfirm ? (
            <>
              <span className="text-sm text-muted-foreground me-2">
                Remove configuration for this category?
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
