import { describe, expect, it } from 'vitest';
import { sortAliasesByDefinitionOrder } from '../../src/sort/index';

describe('sortAliasesByDefinitionOrder', () => {
  it('should sort agent aliases first in definition order', () => {
    const aliases = {
      'oracle/gpt-5.5': 'claude-3',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('sisyphus/gpt-5.5');
    expect(keys[1]).toBe('oracle/gpt-5.5');
  });

  it('should sort category aliases after agent aliases', () => {
    const aliases = {
      'quick/gpt-5.5': 'fast-model',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('sisyphus/gpt-5.5');
    expect(keys[1]).toBe('quick/gpt-5.5');
  });

  it('should sort custom aliases last alphabetically', () => {
    const aliases = {
      'custom-b/gpt-5.5': 'model-b',
      'custom-a/gpt-5.5': 'model-a',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('sisyphus/gpt-5.5');
    expect(keys[1]).toBe('custom-a/gpt-5.5');
    expect(keys[2]).toBe('custom-b/gpt-5.5');
  });

  it('should preserve insertion order within same agent prefixed keys', () => {
    // The sort preserves insertion order from when entries were added to agentAliases
    const aliases = {
      'sisyphus/gpt-5.4': 'gpt-4o-mini',
      'sisyphus': 'sisyphus-model',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    // The insertion order is: sisyphus/gpt-5.4, sisyphus, sisyphus/gpt-5.5
    // All match 'sisyphus' so they all get added in insertion order
    expect(keys).toEqual(['sisyphus/gpt-5.4', 'sisyphus', 'sisyphus/gpt-5.5']);
  });

  it('should preserve values when sorting', () => {
    const aliases = {
      'oracle/gpt-5.5': 'claude-3',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    expect(result).toEqual({
      'sisyphus/gpt-5.5': 'gpt-4o',
      'oracle/gpt-5.5': 'claude-3',
    });
  });

  it('should handle empty input', () => {
    const result = sortAliasesByDefinitionOrder({});
    expect(result).toEqual({});
  });

  it('should handle all categories in order', () => {
    const aliases = {
      'writing/gpt-5.5': 'model',
      'quick/gpt-5.5': 'model',
      'deep/gpt-5.5': 'model',
      'visual-engineering/gpt-5.5': 'model',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    expect(keys[0]).toBe('visual-engineering/gpt-5.5');
    expect(keys[1]).toBe('deep/gpt-5.5');
    expect(keys[2]).toBe('quick/gpt-5.5');
    expect(keys[3]).toBe('writing/gpt-5.5');
  });

  it('should handle mixed agents, categories, and custom', () => {
    const aliases = {
      'custom-1/gpt-5.5': 'model',
      'metis/gpt-5.5': 'model',
      'quick/gpt-5.5': 'model',
      'sisyphus/gpt-5.5': 'model',
    };
    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);
    expect(keys).toEqual([
      'sisyphus/gpt-5.5',
      'metis/gpt-5.5',
      'quick/gpt-5.5',
      'custom-1/gpt-5.5',
    ]);
  });
});
