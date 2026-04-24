import { useCallback } from 'react';
import { normalizeHexColor } from '../../lib/utils';
import type { AgentConfig } from '../../types/agent-routing';
import { Input } from '../input';
import { Label } from '../label';
import { ModelFallbackSelector } from '../model-fallback-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Textarea } from '../textarea';

type UpdateConfigFn = (
  field: keyof AgentConfig,
  value: AgentConfig[keyof AgentConfig],
) => void;

type BasicSectionProps = {
  config: AgentConfig;
  onUpdateConfig: UpdateConfigFn;
};

type ModelSectionProps = {
  agentKey: string;
  config: AgentConfig;
  onUpdateConfig: UpdateConfigFn;
};

export function AgentConfigEditorBasicSection({
  config,
  onUpdateConfig,
}: BasicSectionProps) {
  const handleColorChange = useCallback(
    (value: string) => {
      const normalized = normalizeHexColor(value);
      if (normalized) {
        onUpdateConfig('color', normalized);
      }
    },
    [onUpdateConfig],
  );

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Basic Information</h3>
        <p className="text-xs text-muted-foreground">
          Identity, grouping and availability controls.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={config.category || ''}
            onChange={(e) => onUpdateConfig('category', e.target.value)}
            placeholder="Enter category"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mode">Mode</Label>
          <Select
            value={config.mode || 'subagent'}
            onValueChange={(value: 'subagent' | 'primary' | 'all') =>
              onUpdateConfig('mode', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subagent">Subagent</SelectItem>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color || '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-md border border-border"
            />
            <Input
              id="color"
              value={config.color || ''}
              onChange={(e) => handleColorChange(e.target.value)}
              placeholder="#RRGGBB"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Disable</Label>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={!!config.disable}
              onChange={(e) => onUpdateConfig('disable', e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">
              Disable this agent
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={config.description || ''}
          onChange={(e) => onUpdateConfig('description', e.target.value)}
          placeholder="Enter description"
          rows={3}
        />
      </div>
    </section>
  );
}

export function AgentConfigEditorModelSection({
  agentKey,
  config,
  onUpdateConfig,
}: ModelSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Model Configuration</h3>
        <p className="text-xs text-muted-foreground">
          Select the primary model, fallback chain and sampling behavior.
        </p>
      </div>

      <ModelFallbackSelector
        primaryModel={config.model || ''}
        fallbackModels={config.fallback_models || []}
        onPrimaryModelChange={(model) => onUpdateConfig('model', model)}
        onFallbackModelsChange={(models) =>
          onUpdateConfig('fallback_models', models)
        }
        agentKey={agentKey}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature ?? ''}
            onChange={(e) =>
              onUpdateConfig(
                'temperature',
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            placeholder="0.0 - 2.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="top_p">Top P</Label>
          <Input
            id="top_p"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={config.top_p ?? ''}
            onChange={(e) =>
              onUpdateConfig(
                'top_p',
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            placeholder="0.0 - 1.0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Input
            id="variant"
            value={config.variant || ''}
            onChange={(e) => onUpdateConfig('variant', e.target.value)}
            placeholder="Enter variant"
          />
        </div>
      </div>
    </section>
  );
}

export function AgentConfigEditorPromptsSection({
  config,
  onUpdateConfig,
}: BasicSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Prompts</h3>
        <p className="text-xs text-muted-foreground">
          Prompt templates and appended context for this agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          value={config.prompt || ''}
          onChange={(e) => onUpdateConfig('prompt', e.target.value)}
          placeholder="Enter prompt"
          rows={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt_append">Prompt Append</Label>
        <Textarea
          id="prompt_append"
          value={config.prompt_append || ''}
          onChange={(e) => onUpdateConfig('prompt_append', e.target.value)}
          placeholder="Enter prompt append"
          rows={5}
        />
      </div>
    </section>
  );
}
