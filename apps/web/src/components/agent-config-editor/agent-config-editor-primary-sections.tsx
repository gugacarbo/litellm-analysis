import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AgentConfig } from '../../types/agent-routing';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../collapsible';
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
import { Separator } from '../separator';
import { Textarea } from '../textarea';

type AgentConfigEditorPrimarySectionsProps = {
  agentKey: string;
  config: AgentConfig;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onUpdateConfig: (
    field: keyof AgentConfig,
    value: AgentConfig[keyof AgentConfig],
  ) => void;
};

export function AgentConfigEditorPrimarySections({
  agentKey,
  config,
  expandedSections,
  onToggleSection,
  onUpdateConfig,
}: AgentConfigEditorPrimarySectionsProps) {
  return (
    <>
      <Collapsible
        open={expandedSections.basic}
        onOpenChange={() => onToggleSection('basic')}
      >
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              {expandedSections.basic ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <h3 className="font-semibold">Basic Information</h3>
        </div>
        <CollapsibleContent className="mt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={config.color || ''}
                  onChange={(e) => onUpdateConfig('color', e.target.value)}
                  placeholder="#RRGGBB"
                  className="flex-1"
                />
                {config.color ? (
                  <div
                    className="w-6 h-6 rounded border border-border shadow-sm"
                    style={{ backgroundColor: config.color }}
                  />
                ) : null}
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
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <Collapsible
        open={expandedSections.model}
        onOpenChange={() => onToggleSection('model')}
      >
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              {expandedSections.model ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <h3 className="font-semibold">Model Configuration</h3>
        </div>
        <CollapsibleContent className="mt-2 space-y-4">
          <ModelFallbackSelector
            primaryModel={config.model || ''}
            fallbackModels={config.fallback_models || []}
            onPrimaryModelChange={(model) => onUpdateConfig('model', model)}
            onFallbackModelsChange={(models) =>
              onUpdateConfig('fallback_models', models)
            }
            agentKey={agentKey}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      <Collapsible
        open={expandedSections.prompts}
        onOpenChange={() => onToggleSection('prompts')}
      >
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              {expandedSections.prompts ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <h3 className="font-semibold">Prompts</h3>
        </div>
        <CollapsibleContent className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={config.prompt || ''}
              onChange={(e) => onUpdateConfig('prompt', e.target.value)}
              placeholder="Enter prompt"
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt_append">Prompt Append</Label>
            <Textarea
              id="prompt_append"
              value={config.prompt_append || ''}
              onChange={(e) => onUpdateConfig('prompt_append', e.target.value)}
              placeholder="Enter prompt append"
              rows={4}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
