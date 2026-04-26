import { describe, expect, it } from 'vitest';
import {
  getExistingAliasesForAgent,
  replaceAliasesForAgent,
} from '../../src/alias/cleanup';

describe('getExistingAliasesForAgent', () => {
  it('should return all aliases for an agent key', () => {
    const aliases = {
      'sisyphus/gpt-5.5': 'gpt-4o',
      'sisyphus/gpt-5.4': 'gpt-4o-mini',
      'oracle/gpt-5.5': 'claude-3',
    };
    const result = getExistingAliasesForAgent('sisyphus', aliases);
    expect(result).toEqual(['sisyphus/gpt-5.5', 'sisyphus/gpt-5.4']);
  });

  it('should return empty array if no aliases for key', () => {
    const aliases = {
      'oracle/gpt-5.5': 'claude-3',
    };
    const result = getExistingAliasesForAgent('sisyphus', aliases);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty aliases', () => {
    const result = getExistingAliasesForAgent('sisyphus', {});
    expect(result).toEqual([]);
  });

  it('should match partial key prefixes', () => {
    const aliases = {
      'sisyphus-junior/gpt-5.5': 'gpt-4o',
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = getExistingAliasesForAgent('sisyphus', aliases);
    expect(result).toEqual(['sisyphus/gpt-5.5']);
  });
});

describe('replaceAliasesForAgent', () => {
  it('should replace existing aliases with new ones', () => {
    const existing = {
      'sisyphus/gpt-5.5': 'gpt-4o',
      'sisyphus/gpt-5.4': 'gpt-4o-mini',
      'oracle/gpt-5.5': 'claude-3',
    };
    const newAliases = {
      'sisyphus/gpt-5.5': 'gpt-4o-new',
      'sisyphus/gpt-5.4': 'gpt-4o-mini-new',
    };
    const result = replaceAliasesForAgent(existing, 'sisyphus', newAliases);
    expect(result).toEqual({
      'sisyphus/gpt-5.5': 'gpt-4o-new',
      'sisyphus/gpt-5.4': 'gpt-4o-mini-new',
      'oracle/gpt-5.5': 'claude-3',
    });
  });

  it('should remove old aliases that are not in new aliases', () => {
    const existing = {
      'sisyphus/gpt-5.5': 'gpt-4o',
      'sisyphus/gpt-5.4': 'gpt-4o-mini',
      'sisyphus/gpt-5.3': 'claude-3-haiku',
    };
    const newAliases = {
      'sisyphus/gpt-5.5': 'gpt-4o-new',
    };
    const result = replaceAliasesForAgent(existing, 'sisyphus', newAliases);
    expect(result).toEqual({
      'sisyphus/gpt-5.5': 'gpt-4o-new',
    });
  });

  it('should add new aliases when none exist', () => {
    const existing = {
      'oracle/gpt-5.5': 'claude-3',
    };
    const newAliases = {
      'sisyphus/gpt-5.5': 'gpt-4o',
    };
    const result = replaceAliasesForAgent(existing, 'sisyphus', newAliases);
    expect(result).toEqual({
      'oracle/gpt-5.5': 'claude-3',
      'sisyphus/gpt-5.5': 'gpt-4o',
    });
  });

  it('should not modify original aliases object', () => {
    const existing = {
      'sisyphus/gpt-5.5': 'gpt-4o',
      'oracle/gpt-5.5': 'claude-3',
    };
    const original = { ...existing };
    replaceAliasesForAgent(existing, 'sisyphus', { 'sisyphus/gpt-5.5': 'new' });
    expect(existing).toEqual(original);
  });

  it('should handle empty new aliases (effectively clearing)', () => {
    const existing = {
      'sisyphus/gpt-5.5': 'gpt-4o',
      'oracle/gpt-5.5': 'claude-3',
    };
    const result = replaceAliasesForAgent(existing, 'sisyphus', {});
    expect(result).toEqual({
      'oracle/gpt-5.5': 'claude-3',
    });
  });
});
