import type { AgentConfig } from '../../types/agent-routing';
import { Input } from '../input';
import { Label } from '../label';
import { ModelFallbackSelector } from '../model-fallback-selector';

type UpdateConfigFn = (
  field: keyof AgentConfig,
  value: AgentConfig[keyof AgentConfig],
) => void;

type ModelSectionProps = {
  agentKey: string;
  config: AgentConfig;
  onUpdateConfig: UpdateConfigFn;
};

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
