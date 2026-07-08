/**
 * Structured model routing config for `model_proxy_models`.
 */

import type {
  Architecture,
  DefaultParameters,
  PerRequestLimits,
  Pricing,
  Reasoning,
  RequestOptions,
  SupportedParameters,
} from "@lite-llm/database/schema/model-proxy-types";

export interface ModelRoute {
  modelId: string;
  modelName?: string;
  enabled?: boolean;
  displayName?: string;
  family?: string;
  canonicalSlug?: string;
  description?: string;
  contextLength?: number;
  contextWindowSize?: number;
  maxCompletionTokens?: number;
  maxOutputTokens?: number;
  knowledgeCutoff?: string;
  expirationDate?: string;
  architecture?: Architecture | null;
  reasoning?: Reasoning | null;
  supportedParameters?: SupportedParameters | null;
  defaultParameters?: DefaultParameters | null;
  perRequestLimits?: PerRequestLimits | null;
  pricing?: Pricing | null;
  reasoningApiSlug?: string;
  requestOptions?: RequestOptions;
  providerName?: string;
  ownedBy?: string;
  apiMode?: string;
  vision?: boolean;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
}

export type ModelRouteUpdate = Partial<Omit<ModelRoute, "modelId">>;

export interface ModelProxyModelRecord {
  id: string;
  modelId: string;
  enabled: boolean;
  displayName: string | null;
  family: string | null;
  canonicalSlug: string | null;
  description: string | null;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  knowledgeCutoff: string | null;
  expirationDate: string | null;
  architecture: Architecture | null;
  reasoning: Reasoning | null;
  supportedParameters: SupportedParameters | null;
  defaultParameters: DefaultParameters | null;
  perRequestLimits: PerRequestLimits | null;
  pricing: Pricing | null;
  requestOptions: RequestOptions | null;
  providerId: string | null;
  reasoningApiId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RouteParams = Partial<Pick<ModelRoute, ReservedRouteParamKey>>;

export const RESERVED_ROUTE_PARAM_KEYS = [
  "modelId",
  "enabled",
  "displayName",
  "family",
  "canonicalSlug",
  "description",
  "contextLength",
  "maxCompletionTokens",
  "knowledgeCutoff",
  "expirationDate",
  "architecture",
  "reasoning",
  "supportedParameters",
  "defaultParameters",
  "perRequestLimits",
  "pricing",
  "reasoningApiSlug",
  "requestOptions",
] as const;

export type ReservedRouteParamKey = (typeof RESERVED_ROUTE_PARAM_KEYS)[number];

export const ROUTE_PARAM_TO_MODEL_ROUTE: Record<
  ReservedRouteParamKey,
  keyof ModelRoute | "modelId"
> = {
  modelId: "modelId",
  enabled: "enabled",
  displayName: "displayName",
  family: "family",
  canonicalSlug: "canonicalSlug",
  description: "description",
  contextLength: "contextLength",
  maxCompletionTokens: "maxCompletionTokens",
  knowledgeCutoff: "knowledgeCutoff",
  expirationDate: "expirationDate",
  architecture: "architecture",
  reasoning: "reasoning",
  supportedParameters: "supportedParameters",
  defaultParameters: "defaultParameters",
  perRequestLimits: "perRequestLimits",
  pricing: "pricing",
  reasoningApiSlug: "reasoningApiSlug",
  requestOptions: "requestOptions",
};

export const MODEL_ROUTE_TO_ROUTE_PARAM: Partial<
  Record<keyof ModelRoute, ReservedRouteParamKey>
> = {
  modelId: "modelId",
  enabled: "enabled",
  displayName: "displayName",
  family: "family",
  canonicalSlug: "canonicalSlug",
  description: "description",
  contextLength: "contextLength",
  maxCompletionTokens: "maxCompletionTokens",
  knowledgeCutoff: "knowledgeCutoff",
  expirationDate: "expirationDate",
  architecture: "architecture",
  reasoning: "reasoning",
  supportedParameters: "supportedParameters",
  defaultParameters: "defaultParameters",
  perRequestLimits: "perRequestLimits",
  pricing: "pricing",
  reasoningApiSlug: "reasoningApiSlug",
  requestOptions: "requestOptions",
};
