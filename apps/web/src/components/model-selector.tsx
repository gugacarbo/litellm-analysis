'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllModels } from '../lib/api-client';
import type { ModelConfig } from '../types/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './select';

type ModelSelectorProps = {
  value?: string;
  onChange?: (model: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function ModelSelector({
  value,
  onChange,
  placeholder = 'Select a model...',
  disabled = false,
  className,
  label,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useMemo(() => `model-selector-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    async function fetchModels() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedModels = await getAllModels();
        setModels(fetchedModels);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('Failed to load models');
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  const selectedModel = useMemo(() => {
    return models.find(model => model.modelName === value);
  }, [models, value]);

  useEffect(() => {
    if (value && models.length > 0 && !selectedModel && onChange) {
      onChange('');
    }
  }, [value, models, selectedModel, onChange]);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <Select 
        value={value} 
        onValueChange={onChange} 
        disabled={disabled || isLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {error && (
            <SelectItem value="" disabled className="text-destructive">
              Error loading models
            </SelectItem>
          )}
          {isLoading ? (
            <SelectItem value="" disabled>
              Loading models...
            </SelectItem>
          ) : models.length === 0 ? (
            <SelectItem value="" disabled>
              No models available
            </SelectItem>
          ) : (
            <>
              {label && <SelectLabel>{label}</SelectLabel>}
              {models.map((model) => (
                <SelectItem 
                  key={model.modelName} 
                  value={model.modelName}
                >
                  {model.modelName}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}