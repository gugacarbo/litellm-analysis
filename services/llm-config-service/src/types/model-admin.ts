import type { ModelProxyModel } from "@lite-llm/database/schema";

/** Public, transport-agnostic contract for model registry administration. */
export type DomainErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DESTINATION_BLOCKED"
  | "UPSTREAM_UNAVAILABLE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "INTERNAL";

export class ModelAdminError extends Error {
  readonly currentRevision?: number;
  readonly dependentModelCount?: number;

  constructor(
    readonly code: DomainErrorCode,
    message: string,
    options: {
      currentRevision?: number;
      dependentModelCount?: number;
      retryable?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "ModelAdminError";
    this.currentRevision = options.currentRevision;
    this.dependentModelCount = options.dependentModelCount;
    this.retryable = options.retryable ?? false;
  }

  readonly retryable: boolean;

  toPublic(): {
    ok: false;
    error: {
      code: DomainErrorCode;
      message: string;
      retryable: boolean;
      currentRevision?: number;
      dependentModelCount?: number;
    };
  } {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        ...(this.currentRevision !== undefined
          ? { currentRevision: this.currentRevision }
          : {}),
        ...(this.dependentModelCount !== undefined
          ? { dependentModelCount: this.dependentModelCount }
          : {}),
      },
    };
  }
}

export type CredentialCommand =
  | { kind: "preserve" }
  | { kind: "replace"; value: string }
  | { kind: "remove" };

export interface ProviderRow {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  isDefault: boolean;
  credentialEnvelope: string | null;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ModelSettings = Pick<
  ModelProxyModel,
  | "displayName"
  | "family"
  | "canonicalSlug"
  | "description"
  | "contextLength"
  | "maxCompletionTokens"
  | "knowledgeCutoff"
  | "expirationDate"
  | "architecture"
  | "reasoning"
  | "supportedParameters"
  | "defaultParameters"
  | "perRequestLimits"
  | "pricing"
  | "requestOptions"
  | "reasoningApiId"
>;

export type ModelRow = Pick<
  ModelProxyModel,
  | "id"
  | "providerId"
  | "modelId"
  | "enabled"
  | "revision"
  | "createdAt"
  | "updatedAt"
> &
  ModelSettings;

export interface AliasRow {
  id: string;
  alias: string;
  aliasNormalized: string;
  targetModelId: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderPublic {
  id: string;
  name: string;
  provider: string | null;
  baseUrl: string | null;
  isDefault: boolean;
  hasStoredSecret: boolean;
  credentialStatus: "configured" | "missing";
  modelCount: number;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AliasPublic {
  id: string;
  alias: string;
  aliasNormalized: string;
  targetModelId: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelSummary extends ModelSettings {
  id: ModelRow["id"];
  providerId: ModelRow["providerId"];
  providerName: string;
  modelId: ModelRow["modelId"];
  enabled: ModelRow["enabled"];
  revision: ModelRow["revision"];
  createdAt: ModelRow["createdAt"];
  updatedAt: ModelRow["updatedAt"];
}

export interface ModelDetail extends ModelSummary {
  aliases: AliasPublic[];
}

export interface SaveModelInput extends Partial<ModelSettings> {
  id?: string;
  providerId: string;
  modelId: string;
  enabled?: boolean;
  aliases?: string[];
  expectedRevision?: number;
}

export interface CreateProviderInput {
  name: string;
  provider?: string | null;
  baseUrl?: string | null;
  isDefault?: boolean;
  credential?: Exclude<CredentialCommand, { kind: "preserve" }>;
}

export interface UpdateProviderInput {
  id: string;
  expectedRevision: number;
  name?: string;
  provider?: string | null;
  baseUrl?: string | null;
  credential?: CredentialCommand;
}

export interface SetDefaultProviderInput {
  id: string;
  expectedRevision: number;
}

export interface UpdateAliasInput {
  id: string;
  expectedRevision: number;
  alias: string;
  targetModelId: string;
}

export interface ToggleModelInput {
  id: string;
  expectedRevision: number;
  enabled: boolean;
}

export interface DiscoverySelectionItem {
  modelId: string;
  displayName?: string | null;
  enabled?: boolean;
  expectedRevision?: number;
}

export interface ApplyDiscoverySelectionInput {
  providerId: string;
  items: DiscoverySelectionItem[];
}

export type DiscoveryApplyResult = {
  modelId: string;
  status: "created" | "updated" | "unchanged" | "conflict";
  currentRevision?: number;
};

export interface DiscoveredModel {
  modelId: string;
  displayName: string | null;
  status: "new" | "changed" | "unchanged" | "conflict";
  currentRevision?: number;
}

export interface DiscoveryResult {
  models: DiscoveredModel[];
}

export interface ProbeModelInput {
  providerId: string;
  modelId: string;
  prompt: string;
}

export interface ProbeModelResult {
  modelId: string;
  content: string;
  truncated: boolean;
}

export interface PreparedProviderDestination {
  url: URL;
  address: string;
}

export interface UpstreamRequest {
  method: "GET" | "POST";
  url: URL;
  address: string;
  headers: Record<string, string>;
  body?: string;
}

export interface UpstreamResponse {
  status: number;
  body: string;
}

export interface OpenAiCompatibleTransport {
  request(input: UpstreamRequest): Promise<UpstreamResponse>;
}

export type ProviderDestinationResolver = (
  hostname: string,
) => Promise<string[]>;

export interface ModelAdminRepository {
  transaction<T>(
    operation: (repository: ModelAdminRepository) => Promise<T>,
  ): Promise<T>;
  getProvider(id: string): Promise<ProviderRow | null>;
  getProviderByName(name: string): Promise<ProviderRow | null>;
  listProviders(): Promise<ProviderRow[]>;
  insertProvider(
    input: Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<ProviderRow>;
  updateProviderIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ): Promise<ProviderRow | null>;
  clearDefaultProviders(exceptId?: string): Promise<void>;
  countModelsByProvider(providerId: string): Promise<number>;
  deleteProvider(id: string): Promise<boolean>;
  getModel(id: string): Promise<ModelRow | null>;
  getModelByProviderAndModelId(
    providerId: string,
    modelId: string,
  ): Promise<ModelRow | null>;
  listModels(): Promise<ModelRow[]>;
  insertModel(
    input: Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<ModelRow>;
  updateModelIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ): Promise<ModelRow | null>;
  deleteModelIfRevision(
    id: string,
    expectedRevision: number,
  ): Promise<boolean | "conflict">;
  listAliases(): Promise<AliasRow[]>;
  listAliasesForModel(modelId: string): Promise<AliasRow[]>;
  insertAlias(
    input: Omit<AliasRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<AliasRow>;
  updateAliasIfRevision(
    id: string,
    expectedRevision: number,
    input: Pick<AliasRow, "alias" | "aliasNormalized" | "targetModelId">,
  ): Promise<AliasRow | null>;
  deleteAliasIfRevision(
    id: string,
    expectedRevision: number,
  ): Promise<boolean | "conflict">;
  deleteAliasesForModel(modelId: string): Promise<void>;
}
