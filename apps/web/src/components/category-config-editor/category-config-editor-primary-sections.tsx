import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryConfig } from '../../types/agent-routing';
import { Button } from '../button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../collapsible';
import { Input } from '../input';
import { Label } from '../label';
import { ModelFallbackSelector } from '../model-fallback-selector';
import { Separator } from '../separator';
import { Textarea } from '../textarea';

type Props = {
  categoryKey: string;
  config: CategoryConfig;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onUpdateConfig: (
    field: keyof CategoryConfig,
    value: CategoryConfig[keyof CategoryConfig],
  ) => void;
};

export function CategoryConfigEditorPrimarySections({
  categoryKey,
  config,
  expandedSections,
  onToggleSection,
  onUpdateConfig,
}: Props) {
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={!!config.is_unstable_agent}
                onChange={(e) =>
                  onUpdateConfig('is_unstable_agent', e.target.checked)
                }
                className="h-4 w-4"
              />
              <Label>Is Unstable Agent</Label>
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
            agentKey={categoryKey}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="0"
                value={config.maxTokens ?? ''}
                onChange={(e) =>
                  onUpdateConfig(
                    'maxTokens',
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                placeholder="Max tokens"
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
    </>
  );
}
