'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CategoryConfig } from '../types/agent-routing';
import { Button } from './button';
import { CategoryConfigEditorAdvancedSection } from './category-config-editor/category-config-editor-advanced-section';
import { CategoryConfigEditorExecutionSection } from './category-config-editor/category-config-editor-execution-section';
import {
  CategoryConfigEditorBasicSection,
  CategoryConfigEditorModelSection,
} from './category-config-editor/category-config-editor-primary-sections';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

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

type CategoryEditorTab = 'overview' | 'model' | 'advanced' | 'execution';

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
  const [activeTab, setActiveTab] = useState<CategoryEditorTab>('overview');
  const [config, setConfig] = useState<CategoryConfig>(() =>
    normalizeCategoryConfig(initialConfig),
  );
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

  useEffect(() => {
    if (!open) return;
    setActiveTab('overview');
    setResetConfirm(false);
  }, [open]);

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

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as CategoryEditorTab)}
          className="py-4"
        >
          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap justify-start rounded-xl bg-muted/35 p-1"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <CategoryConfigEditorBasicSection
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <CategoryConfigEditorModelSection
                categoryKey={categoryKey}
                config={config}
                onUpdateConfig={updateConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <CategoryConfigEditorAdvancedSection
                config={config}
                onUpdateConfig={updateConfig}
                onUpdateThinkingConfig={updateThinkingConfig}
              />
            </div>
          </TabsContent>

          <TabsContent value="execution" className="mt-4">
            <div className="rounded-xl border bg-card p-4">
              <CategoryConfigEditorExecutionSection
                config={config}
                newToolKey={newToolKey}
                newToolValue={newToolValue}
                onUpdateConfig={updateConfig}
                onNewToolKeyChange={setNewToolKey}
                onNewToolValueChange={setNewToolValue}
                onAddTool={addTool}
                onRemoveTool={removeTool}
                onUpdateToolValue={updateToolValue}
              />
            </div>
          </TabsContent>
        </Tabs>

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
