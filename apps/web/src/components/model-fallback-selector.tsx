'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Badge } from './badge';
import { Input } from './input';
import type { ModelConfig } from '../lib/api-client';

const NONE_VALUE = '__none__';

interface ModelFallbackSelectorProps {
  primaryModel: string;
  fallbackModels: string[];
  onPrimaryModelChange: (model: string) => void;
  onFallbackModelsChange: (models: string[]) => void;
  agentKey: string;
}

export function ModelFallbackSelector({
  primaryModel,
  fallbackModels,
  onPrimaryModelChange,
  onFallbackModelsChange,
  agentKey,
}: ModelFallbackSelectorProps) {
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModels() {
      try {
        const models = await import('../lib/api-client').then(m => m.getAllModels());
        setAvailableModels(models);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    
    loadModels();
  }, []);

  const addFallbackModel = () => {
    onFallbackModelsChange([...fallbackModels, '']);
  };

  const updateFallbackModel = (index: number, model: string) => {
    const resolved = model === NONE_VALUE ? '' : model;
    const newFallbacks = [...fallbackModels];
    newFallbacks[index] = resolved;
    onFallbackModelsChange(newFallbacks);
  };

  const removeFallbackModel = (index: number) => {
    const newFallbacks = [...fallbackModels];
    newFallbacks.splice(index, 1);
    onFallbackModelsChange(newFallbacks);
  };

  const clearPrimaryModel = () => {
    onPrimaryModelChange('');
    setUseCustomModel(false);
    setCustomModelName('');
  };

  const handlePrimarySelect = (value: string) => {
    if (value === NONE_VALUE) {
      onPrimaryModelChange('');
      setUseCustomModel(false);
    } else if (value === '__custom__') {
      setUseCustomModel(true);
      setCustomModelName('');
      onPrimaryModelChange('');
    } else {
      onPrimaryModelChange(value);
      setUseCustomModel(false);
    }
  };

  const handleCustomModelConfirm = () => {
    if (customModelName.trim()) {
      onPrimaryModelChange(customModelName.trim());
    }
  };

  const getSelectValue = (modelValue: string) => {
    if (!modelValue) return NONE_VALUE;
    const isKnown = availableModels.some(m => m.modelName === modelValue);
    return isKnown ? modelValue : '__custom__';
  };

  const getFallbackSelectValue = (modelValue: string) => {
    if (!modelValue) return NONE_VALUE;
    return modelValue;
  };

  const getPreviewAliases = () => {
    const aliases = [];
    if (primaryModel) {
      aliases.push(`litellm/${agentKey} → ${primaryModel}`);
    }
    fallbackModels.forEach((model, idx) => {
      if (model) {
        aliases.push(`litellm/${agentKey}_fallback_${idx + 1} → ${model}`);
      }
    });
    return aliases;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Primary Model</label>
        <div className="flex items-center gap-2">
          {useCustomModel ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder="e.g. litellm/qwen3.5-plus"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomModelConfirm();
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleCustomModelConfirm}>
                Apply
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearPrimaryModel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <Select value={getSelectValue(primaryModel)} onValueChange={handlePrimarySelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select primary model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model.modelName} value={model.modelName}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom model...</SelectItem>
                </SelectContent>
              </Select>
              {primaryModel && (
                <Button type="button" variant="ghost" size="sm" onClick={clearPrimaryModel}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
        {primaryModel && !useCustomModel && (
          <p className="text-xs text-muted-foreground">Current: {primaryModel}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Fallback Models</label>
          <Button type="button" variant="outline" size="sm" onClick={addFallbackModel}>
            <Plus className="h-3 w-3" />
            Add Fallback
          </Button>
        </div>
        
        {fallbackModels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fallback models configured</p>
        ) : (
          <div className="space-y-2">
            {fallbackModels.map((model, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select value={getFallbackSelectValue(model)} onValueChange={(value) => updateFallbackModel(index, value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select fallback model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {availableModels.map((m) => (
                      <SelectItem key={m.modelName} value={m.modelName}>
                        {m.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFallbackModel(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Litellm Alias Preview</label>
        <div className="space-y-1 text-xs">
          {getPreviewAliases().length > 0 ? (
            getPreviewAliases().map((alias, idx) => (
              <Badge key={idx} variant="secondary" className="break-all">
                {alias}
              </Badge>
            ))
          ) : (
            <p className="text-muted-foreground">No aliases will be created</p>
          )}
        </div>
      </div>
    </div>
  );
}