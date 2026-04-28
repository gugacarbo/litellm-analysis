import type { Application } from 'express';
import type { RouteOptions } from '../../types/index.js';

export interface GlobalFallbackBody {
  globalFallbackModel?: string;
}

export interface AgentConfigItemBody {
  type: 'agent' | 'category';
  config: Record<string, unknown>;
  syncAliases?: boolean;
}

export interface BulkConfigBody {
  agents?: Record<string, Record<string, unknown>>;
  categories?: Record<string, Record<string, unknown>>;
}

export type RouteRegistrar = (
  app: Application,
  opts: RouteOptions,
) => void;
