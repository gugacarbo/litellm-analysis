import { describe, expect, it } from 'vitest';
import {
  isLogicalModelForKey,
  resolveConfiguredModels,
  resolveModelValue,
} from '../../src/alias/resolve';

describe('isLogicalModelForKey', () => {
  it('should return true for logical model references', () => {
    expect(isLogicalModelForKey('sisyphus', 'sisyphus/gpt-5.5')).toBe(true);
    expect(isLogicalModelForKey('sisyphus', 'sisyphus/gpt-5.4')).toBe(true);
    expect(isLogicalModelForKey('sisyphus', 'sisyphus/gpt-5.1')).toBe(true);
  });

  it('should return false for non-logical references', () => {
    expect(isLogicalModelForKey('sisyphus', 'gpt-4o')).toBe(false);
    expect(isLogicalModelForKey('sisyphus', 'claude-3')).toBe(false);
    expect(isLogicalModelForKey('sisyphus', 'sisyphus-other/gpt-5.5')).toBe(false);
  });

  it('should return false for invalid model versions', () => {
    expect(isLogicalModelForKey('sisyphus', 'sisyphus/gpt-4.0')).toBe(false);
    expect(isLogicalModelForKey('sisyphus', 'sisyphus/gpt-6.0')).toBe(false);
  });

  it('should handle category keys with dashes', () => {
    expect(isLogicalModelForKey('visual-engineering', 'visual-engineering/gpt-5.5')).toBe(
      true,
    );
    expect(isLogicalModelForKey('unspecified-high', 'unspecified-high/gpt-5.5')).toBe(
      true,
    );
  });

  it('should be case-sensitive', () => {
    expect(isLogicalModelForKey('sisyphus', 'Sisyphus/gpt-5.5')).toBe(false);
  });
});

describe('resolveModelValue', () => {
  const aliases = {
    'sisyphus/gpt-5.5': 'gpt-4o',
    'sisyphus/gpt-5.4': 'gpt-4o-mini',
    'oracle/gpt-5.5': 'claude-3-sonnet',
  };

  it('should resolve logical model references using aliases', () => {
    expect(resolveModelValue('sisyphus', 'sisyphus/gpt-5.5', aliases)).toBe('gpt-4o');
    expect(resolveModelValue('sisyphus', 'sisyphus/gpt-5.4', aliases)).toBe('gpt-4o-mini');
  });

  it('should return unresolved reference if not in aliases', () => {
    expect(resolveModelValue('sisyphus', 'sisyphus/gpt-5.3', aliases)).toBe('');
  });

  it('should return non-logical values as-is', () => {
    expect(resolveModelValue('sisyphus', 'gpt-4o', aliases)).toBe('gpt-4o');
    expect(resolveModelValue('sisyphus', 'claude-3', aliases)).toBe('claude-3');
  });

  it('should return empty string for empty input', () => {
    expect(resolveModelValue('sisyphus', '', aliases)).toBe('');
    expect(resolveModelValue('sisyphus', '   ', aliases)).toBe('');
  });

  it('should trim whitespace from input', () => {
    expect(resolveModelValue('sisyphus', '  sisyphus/gpt-5.5  ', aliases)).toBe('gpt-4o');
  });
});

describe('resolveConfiguredModels', () => {
  const aliases = {
    'sisyphus/gpt-5.5': 'gpt-4o',
    'sisyphus/gpt-5.4': 'gpt-4o-mini',
    'sisyphus/gpt-5.3': 'claude-3-haiku',
  };

  it('should resolve primary model and fallbacks', () => {
    const result = resolveConfiguredModels(
      'sisyphus',
      'sisyphus/gpt-5.5',
      ['sisyphus/gpt-5.4', 'sisyphus/gpt-5.3'],
      aliases,
    );
    expect(result).toEqual({
      actualModel: 'gpt-4o',
      actualFallbacks: ['gpt-4o-mini', 'claude-3-haiku'],
    });
  });

  it('should filter out unresolved fallbacks', () => {
    const result = resolveConfiguredModels(
      'sisyphus',
      'sisyphus/gpt-5.5',
      ['sisyphus/gpt-5.4', 'sisyphus/gpt-5.1'],
      aliases,
    );
    expect(result).toEqual({
      actualModel: 'gpt-4o',
      actualFallbacks: ['gpt-4o-mini'],
    });
  });

  it('should handle direct model names', () => {
    const result = resolveConfiguredModels(
      'sisyphus',
      'gpt-4o',
      ['gpt-4o-mini'],
      aliases,
    );
    expect(result).toEqual({
      actualModel: 'gpt-4o',
      actualFallbacks: ['gpt-4o-mini'],
    });
  });

  it('should handle undefined fallbacks', () => {
    const result = resolveConfiguredModels('sisyphus', 'sisyphus/gpt-5.5', undefined, aliases);
    expect(result).toEqual({
      actualModel: 'gpt-4o',
      actualFallbacks: [],
    });
  });

  it('should handle empty fallbacks array', () => {
    const result = resolveConfiguredModels('sisyphus', 'sisyphus/gpt-5.5', [], aliases);
    expect(result).toEqual({
      actualModel: 'gpt-4o',
      actualFallbacks: [],
    });
  });

  it('should return empty string for unresolved primary model', () => {
    const result = resolveConfiguredModels('sisyphus', 'sisyphus/gpt-5.1', [], aliases);
    expect(result).toEqual({
      actualModel: '',
      actualFallbacks: [],
    });
  });
});
