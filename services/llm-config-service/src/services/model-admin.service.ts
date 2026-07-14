import { lookup as lookupDns } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { DatabaseClient } from "@lite-llm/database/client";
import {
  modelProxyAliases,
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import {
  decryptProviderSecretForUpstream,
  encryptProviderSecret,
  parseProviderEncryptionKey,
} from "../lib/provider-secrets.js";
import type {
  AliasPublic,
  AliasRow,
  ApplyDiscoverySelectionInput,
  CreateProviderInput,
  CredentialCommand,
  DiscoveryApplyResult,
  DiscoveryResult,
  ModelAdminRepository,
  ModelDetail,
  ModelRow,
  ModelSettings,
  ModelSummary,
  OpenAiCompatibleTransport,
  ProbeModelInput,
  ProbeModelResult,
  ProviderDestinationResolver,
  ProviderPublic,
  ProviderRow,
  SaveModelInput,
  SetDefaultProviderInput,
  ToggleModelInput,
  UpdateAliasInput,
  UpdateProviderInput,
} from "../types/model-admin.js";
import { ModelAdminError } from "../types/model-admin.js";

const UNAUTHENTICATED_PROVIDER_ADAPTERS = new Set(["ollama"]);
const OPENAI_COMPATIBLE_ADAPTER = "openai-compatible";
const CONNECT_TIMEOUT_MS = 3_000;
const UPSTREAM_TIMEOUT_MS = 15_000;
const MAX_UPSTREAM_BODY_BYTES = 1024 * 1024;
const MAX_DISCOVERED_MODELS = 2_000;
const MAX_PROBE_PROMPT_CHARACTERS = 1_024;
const MAX_PROBE_RESPONSE_BYTES = 8 * 1024;
const MODEL_SETTING_KEYS = [
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
  "requestOptions",
  "reasoningApiId",
] as const satisfies ReadonlyArray<keyof ModelSettings>;

export interface ModelAdminServiceOptions {
  db?: DatabaseClient;
  repository?: ModelAdminRepository;
  encryptionKey?: Buffer;
  destinationAllowlist?: string[];
  destinationResolver?: ProviderDestinationResolver;
  upstreamTransport?: OpenAiCompatibleTransport;
}

/**
 * Transport-agnostic registry cases. All persistence-changing aggregates enter
 * through a repository transaction; DTO mapping deliberately excludes envelopes.
 */
export class ModelAdminService {
  private readonly repository: ModelAdminRepository;
  private readonly encryptionKey?: Buffer;
  private readonly destinationAllowlist: ReadonlySet<string>;
  private readonly destinationResolver: ProviderDestinationResolver;
  private readonly upstreamTransport: OpenAiCompatibleTransport;

  constructor(options: ModelAdminServiceOptions = {}) {
    this.repository =
      options.repository ??
      new DrizzleModelAdminRepository(
        options.db ??
          (() => {
            throw new Error("ModelAdminService requires db or repository");
          })(),
      );
    this.encryptionKey = options.encryptionKey;
    this.destinationAllowlist = new Set(
      (options.destinationAllowlist ?? readDestinationAllowlist())
        .map(normalizeAllowedOrigin)
        .filter((origin): origin is string => origin !== null),
    );
    this.destinationResolver =
      options.destinationResolver ?? resolveDnsAddresses;
    this.upstreamTransport =
      options.upstreamTransport ?? new NodeHttpsOpenAiCompatibleTransport();
  }

  async listModels(): Promise<ModelSummary[]> {
    const [models, providers] = await Promise.all([
      this.repository.listModels(),
      this.repository.listProviders(),
    ]);
    const providerNames = new Map(
      providers.map((provider) => [provider.id, provider.name]),
    );
    return models
      .map((model) =>
        toModelSummary(model, providerNames.get(model.providerId)),
      )
      .sort((left, right) =>
        `${left.providerName}/${left.modelId}`.localeCompare(
          `${right.providerName}/${right.modelId}`,
        ),
      );
  }

  async getModel(id: string): Promise<ModelDetail | null> {
    const model = await this.repository.getModel(id);
    if (!model) return null;
    const provider = await this.repository.getProvider(model.providerId);
    if (!provider) {
      throw new ModelAdminError("INTERNAL", "Model provider is unavailable");
    }
    return {
      ...toModelSummary(model, provider.name),
      aliases: (await this.repository.listAliasesForModel(model.id)).map(
        toAliasPublic,
      ),
    };
  }

  async listAliases(): Promise<AliasPublic[]> {
    return (await this.repository.listAliases()).map(toAliasPublic);
  }

  async toggleModel(input: ToggleModelInput): Promise<ModelDetail> {
    return this.inTransaction(async (repository) => {
      const current = await repository.getModel(input.id);
      if (!current) throw new ModelAdminError("NOT_FOUND", "Model not found");
      assertExpectedRevision(input.expectedRevision, current.revision);
      const provider = await repository.getProvider(current.providerId);
      if (!provider) {
        throw new ModelAdminError("INTERNAL", "Model provider is unavailable");
      }
      const aliases = await repository.listAliasesForModel(current.id);
      if (current.enabled === input.enabled) {
        return detailFromRows(current, provider.name, aliases);
      }
      const updated = await repository.updateModelIfRevision(
        current.id,
        current.revision,
        { enabled: input.enabled },
      );
      if (!updated) await throwModelConflict(repository, current.id);
      return detailFromRows(updated as ModelRow, provider.name, aliases);
    });
  }

  async deleteModel(id: string, expectedRevision: number): Promise<void> {
    await this.inTransaction(async (repository) => {
      const current = await repository.getModel(id);
      if (!current) throw new ModelAdminError("NOT_FOUND", "Model not found");
      assertExpectedRevision(expectedRevision, current.revision);
      if ((await repository.listAliasesForModel(current.id)).length > 0) {
        throw new ModelAdminError("CONFLICT", "Model has configured aliases");
      }
      const result = await repository.deleteModelIfRevision(
        current.id,
        current.revision,
      );
      if (result === true) return;
      const fresh = await repository.getModel(current.id);
      if (!fresh) throw new ModelAdminError("NOT_FOUND", "Model not found");
      throw new ModelAdminError(
        "CONFLICT",
        "Model was changed by another request",
        {
          currentRevision: fresh.revision,
        },
      );
    });
  }

  async saveModel(input: SaveModelInput): Promise<ModelDetail> {
    const providerId = requireIdentifier(input.providerId, "providerId");
    const modelId = requireText(input.modelId, "modelId");
    const aliases = normalizeAliases(input.aliases ?? []);

    return this.inTransaction(async (repository) => {
      const provider = await repository.getProvider(providerId);
      if (!provider) {
        throw new ModelAdminError("NOT_FOUND", "Provider not found");
      }

      if (input.id) {
        const current = await repository.getModel(input.id);
        if (!current) throw new ModelAdminError("NOT_FOUND", "Model not found");
        assertExpectedRevision(input.expectedRevision, current.revision);

        const duplicate = await repository.getModelByProviderAndModelId(
          providerId,
          modelId,
        );
        if (duplicate && duplicate.id !== current.id) {
          throw new ModelAdminError(
            "CONFLICT",
            "A model with this provider and model ID already exists",
          );
        }

        const currentAliases = await repository.listAliasesForModel(current.id);
        await assertAliasesAvailable(
          repository,
          aliases,
          new Set(currentAliases.map((alias) => alias.id)),
          provider,
          modelId,
        );
        const nextModel = toModelWrite(input, current, providerId, modelId);
        const modelChanged = !sameModelValues(current, nextModel);
        const aliasesChanged = !sameAliasSet(currentAliases, aliases);
        if (!modelChanged && !aliasesChanged) {
          return detailFromRows(current, provider.name, currentAliases);
        }

        const updated = await repository.updateModelIfRevision(
          current.id,
          current.revision,
          nextModel,
        );
        if (!updated) {
          await throwModelConflict(repository, current.id);
        }
        if (aliasesChanged) {
          await repository.deleteAliasesForModel(current.id);
          await insertAliases(repository, aliases, current.id);
        }
        return detailFromRows(
          updated as ModelRow,
          provider.name,
          aliasesChanged
            ? await repository.listAliasesForModel(current.id)
            : currentAliases,
        );
      }

      const duplicate = await repository.getModelByProviderAndModelId(
        providerId,
        modelId,
      );
      if (duplicate) {
        throw new ModelAdminError(
          "CONFLICT",
          "A model with this provider and model ID already exists",
        );
      }
      await assertAliasesAvailable(
        repository,
        aliases,
        new Set(),
        provider,
        modelId,
      );
      const created = await repository.insertModel(
        toModelWrite(input, undefined, providerId, modelId),
      );
      await insertAliases(repository, aliases, created.id);
      return detailFromRows(
        created,
        provider.name,
        await repository.listAliasesForModel(created.id),
      );
    });
  }

  async listProviders(): Promise<ProviderPublic[]> {
    const providers = await this.repository.listProviders();
    return Promise.all(
      providers.map((provider) => this.toProviderPublic(provider)),
    );
  }

  async getProvider(id: string): Promise<ProviderPublic | null> {
    const provider = await this.repository.getProvider(id);
    return provider ? this.toProviderPublic(provider) : null;
  }

  async createProvider(input: CreateProviderInput): Promise<ProviderPublic> {
    const name = requireText(input.name, "name");
    const provider = requireText(input.provider ?? "", "provider adapter");
    const credentialEnvelope = this.encryptCreateCredential(
      provider,
      input.credential,
    );
    return this.inTransaction(async (repository) => {
      if (await repository.getProviderByName(name)) {
        throw new ModelAdminError(
          "CONFLICT",
          "A provider with this name already exists",
        );
      }
      if (input.isDefault) await repository.clearDefaultProviders();
      const created = await repository.insertProvider({
        name,
        provider,
        baseUrl: optionalText(input.baseUrl),
        isDefault: input.isDefault ?? false,
        credentialEnvelope,
      });
      return this.toProviderPublic(created, repository);
    });
  }

  async updateProvider(input: UpdateProviderInput): Promise<ProviderPublic> {
    return this.inTransaction(async (repository) => {
      const current = await repository.getProvider(input.id);
      if (!current)
        throw new ModelAdminError("NOT_FOUND", "Provider not found");
      assertExpectedRevision(input.expectedRevision, current.revision);
      const name =
        input.name === undefined
          ? current.name
          : requireText(input.name, "name");
      const sameName = name === current.name;
      if (!sameName && (await repository.getProviderByName(name))) {
        throw new ModelAdminError(
          "CONFLICT",
          "A provider with this name already exists",
        );
      }
      const credentialEnvelope = this.resolveCredentialUpdate(
        current.credentialEnvelope,
        input.credential,
      );
      const provider =
        input.provider === undefined
          ? current.provider
          : optionalText(input.provider);
      const baseUrl =
        input.baseUrl === undefined
          ? current.baseUrl
          : optionalText(input.baseUrl);
      if (
        name === current.name &&
        provider === current.provider &&
        baseUrl === current.baseUrl &&
        credentialEnvelope === current.credentialEnvelope
      ) {
        return this.toProviderPublic(current, repository);
      }
      const updated = await repository.updateProviderIfRevision(
        current.id,
        current.revision,
        {
          name,
          provider,
          baseUrl,
          credentialEnvelope,
        },
      );
      if (!updated) await throwProviderConflict(repository, current.id);
      return this.toProviderPublic(updated as ProviderRow, repository);
    });
  }

  async setDefaultProvider(
    input: SetDefaultProviderInput,
  ): Promise<ProviderPublic> {
    return this.inTransaction(async (repository) => {
      const current = await repository.getProvider(input.id);
      if (!current)
        throw new ModelAdminError("NOT_FOUND", "Provider not found");
      assertExpectedRevision(input.expectedRevision, current.revision);
      if (current.isDefault) return this.toProviderPublic(current, repository);
      await repository.clearDefaultProviders(current.id);
      const updated = await repository.updateProviderIfRevision(
        current.id,
        current.revision,
        { isDefault: true },
      );
      if (!updated) await throwProviderConflict(repository, current.id);
      return this.toProviderPublic(updated as ProviderRow, repository);
    });
  }

  async deleteProvider(id: string): Promise<void> {
    await this.inTransaction(async (repository) => {
      const provider = await repository.getProvider(id);
      if (!provider)
        throw new ModelAdminError("NOT_FOUND", "Provider not found");
      const dependentModelCount = await repository.countModelsByProvider(id);
      if (dependentModelCount > 0) {
        throw new ModelAdminError(
          "CONFLICT",
          "Provider has configured models",
          {
            dependentModelCount,
          },
        );
      }
      await repository.deleteProvider(id);
    });
  }

  async updateAlias(input: UpdateAliasInput): Promise<AliasPublic> {
    const alias = normalizeAlias(input.alias);
    return this.inTransaction(async (repository) => {
      const current = (await repository.listAliases()).find(
        (item) => item.id === input.id,
      );
      if (!current) throw new ModelAdminError("NOT_FOUND", "Alias not found");
      assertExpectedRevision(input.expectedRevision, current.revision);
      const target = await repository.getModel(input.targetModelId);
      if (!target)
        throw new ModelAdminError("NOT_FOUND", "Alias target model not found");
      const targetProvider = await repository.getProvider(target.providerId);
      if (!targetProvider)
        throw new ModelAdminError("INTERNAL", "Model provider is unavailable");
      await assertAliasesAvailable(
        repository,
        [alias],
        new Set([current.id]),
        targetProvider,
        target.modelId,
      );
      const updated = await repository.updateAliasIfRevision(
        current.id,
        current.revision,
        {
          alias: alias.alias,
          aliasNormalized: alias.aliasNormalized,
          targetModelId: target.id,
        },
      );
      if (!updated) {
        const fresh = (await repository.listAliases()).find(
          (item) => item.id === current.id,
        );
        throw new ModelAdminError(
          "CONFLICT",
          "Alias was changed by another request",
          {
            currentRevision: fresh?.revision,
          },
        );
      }
      return toAliasPublic(updated);
    });
  }

  async deleteAlias(id: string, expectedRevision: number): Promise<void> {
    await this.inTransaction(async (repository) => {
      const result = await repository.deleteAliasIfRevision(
        id,
        expectedRevision,
      );
      if (result === true) return;
      const current = (await repository.listAliases()).find(
        (alias) => alias.id === id,
      );
      if (!current) throw new ModelAdminError("NOT_FOUND", "Alias not found");
      throw new ModelAdminError(
        "CONFLICT",
        "Alias was changed by another request",
        {
          currentRevision: current.revision,
        },
      );
    });
  }

  async applyDiscoverySelection(
    input: ApplyDiscoverySelectionInput,
  ): Promise<DiscoveryApplyResult[]> {
    const providerId = requireIdentifier(input.providerId, "providerId");
    return this.inTransaction(async (repository) => {
      if (!(await repository.getProvider(providerId))) {
        throw new ModelAdminError("NOT_FOUND", "Provider not found");
      }
      const results: DiscoveryApplyResult[] = [];
      for (const item of input.items) {
        const modelId = requireText(item.modelId, "modelId");
        const current = await repository.getModelByProviderAndModelId(
          providerId,
          modelId,
        );
        if (!current) {
          await repository.insertModel(
            toModelWrite(
              {
                providerId,
                modelId,
                displayName: item.displayName,
                enabled: item.enabled,
              },
              undefined,
              providerId,
              modelId,
            ),
          );
          results.push({ modelId, status: "created" });
          continue;
        }
        if (
          current.displayName === (item.displayName ?? current.displayName) &&
          current.enabled === (item.enabled ?? current.enabled)
        ) {
          results.push({ modelId, status: "unchanged" });
          continue;
        }
        if (
          item.expectedRevision !== undefined &&
          item.expectedRevision !== current.revision
        ) {
          results.push({
            modelId,
            status: "conflict",
            currentRevision: current.revision,
          });
          continue;
        }
        const updated = await repository.updateModelIfRevision(
          current.id,
          current.revision,
          {
            displayName: item.displayName ?? current.displayName,
            enabled: item.enabled ?? current.enabled,
          },
        );
        if (updated) {
          results.push({ modelId, status: "updated" });
          continue;
        }
        const fresh = await repository.getModel(current.id);
        results.push({
          modelId,
          status: "conflict",
          currentRevision: fresh?.revision,
        });
      }
      return results;
    });
  }

  async discoverModels(providerId: string): Promise<DiscoveryResult> {
    const provider = await this.requireOpenAiCompatibleProvider(providerId);
    const destination = await this.prepareDestination(provider, "models");
    const response = await this.withProviderCredential(
      provider,
      async (credential) =>
        this.upstreamTransport.request({
          method: "GET",
          url: destination.url,
          address: destination.address,
          headers: authorizationHeaders(credential),
        }),
    );
    assertUpstreamSuccess(response);
    const payload = parseUpstreamJson(response.body);
    const data =
      payload && typeof payload === "object"
        ? (payload as { data?: unknown }).data
        : undefined;
    if (!Array.isArray(data) || data.length > MAX_DISCOVERED_MODELS) {
      throw upstreamUnavailable();
    }
    const existing = new Map(
      (await this.repository.listModels())
        .filter((model) => model.providerId === provider.id)
        .map((model) => [model.modelId, model]),
    );
    const aliases = new Set(
      (await this.repository.listAliases()).map(
        (alias) => alias.aliasNormalized,
      ),
    );
    const seen = new Set<string>();
    const models: DiscoveryResult["models"] = data.map((item) => {
      const discovered = parseDiscoveredModel(item);
      const { modelId, displayName } = discovered;
      if (seen.has(modelId)) throw upstreamUnavailable();
      seen.add(modelId);
      const model = existing.get(modelId);
      if (aliases.has(normalizeModelId(modelId))) {
        return { modelId, displayName, status: "conflict" as const };
      }
      return {
        modelId,
        displayName,
        status: !model
          ? ("new" as const)
          : displayName !== null && displayName !== model.displayName
            ? ("changed" as const)
            : ("unchanged" as const),
        ...(model ? { currentRevision: model.revision } : {}),
      };
    });
    return { models };
  }

  async probeModel(input: ProbeModelInput): Promise<ProbeModelResult> {
    const providerId = requireIdentifier(input.providerId, "providerId");
    const modelId = requireText(input.modelId, "modelId");
    const prompt = requireText(input.prompt, "prompt");
    if ([...prompt].length > MAX_PROBE_PROMPT_CHARACTERS) {
      throw new ModelAdminError(
        "VALIDATION",
        `prompt must not exceed ${MAX_PROBE_PROMPT_CHARACTERS} characters`,
      );
    }
    const provider = await this.requireOpenAiCompatibleProvider(providerId);
    const destination = await this.prepareDestination(
      provider,
      "chat/completions",
    );
    const response = await this.withProviderCredential(
      provider,
      async (credential) =>
        this.upstreamTransport.request({
          method: "POST",
          url: destination.url,
          address: destination.address,
          headers: {
            ...authorizationHeaders(credential),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        }),
    );
    assertUpstreamSuccess(response);
    const payload = parseUpstreamJson(response.body);
    const content = extractProbeContent(payload);
    const truncated = truncateUtf8(content, MAX_PROBE_RESPONSE_BYTES);
    return {
      modelId,
      content: truncated.value,
      truncated: truncated.didTruncate,
    };
  }

  /** Decrypts only for the immediate server-side upstream operation. */
  async useProviderCredential<T>(
    providerId: string,
    operation: (credential: string | undefined) => Promise<T>,
  ): Promise<T> {
    const provider = await this.repository.getProvider(providerId);
    if (!provider) throw new ModelAdminError("NOT_FOUND", "Provider not found");
    const credential = provider.credentialEnvelope
      ? decryptProviderSecretForUpstream(
          provider.credentialEnvelope,
          this.getEncryptionKey(),
        )
      : undefined;
    return operation(credential);
  }

  private async requireOpenAiCompatibleProvider(
    providerId: string,
  ): Promise<ProviderRow> {
    const provider = await this.repository.getProvider(
      requireIdentifier(providerId, "providerId"),
    );
    if (!provider) throw new ModelAdminError("NOT_FOUND", "Provider not found");
    if (provider.provider !== OPENAI_COMPATIBLE_ADAPTER) {
      throw new ModelAdminError(
        "VALIDATION",
        "Provider does not use the OpenAI-compatible adapter",
      );
    }
    if (!provider.credentialEnvelope) {
      throw new ModelAdminError(
        "VALIDATION",
        "Provider has no usable credential",
      );
    }
    return provider;
  }

  private async prepareDestination(
    provider: ProviderRow,
    endpoint: string,
  ): Promise<{ url: URL; address: string }> {
    if (!provider.baseUrl) {
      throw new ModelAdminError("VALIDATION", "Provider base URL is required");
    }
    let baseUrl: URL;
    try {
      baseUrl = new URL(provider.baseUrl);
    } catch {
      throw new ModelAdminError("VALIDATION", "Provider base URL is invalid");
    }
    if (
      baseUrl.protocol !== "https:" ||
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.search ||
      baseUrl.hash ||
      isIP(baseUrl.hostname)
    ) {
      throw destinationBlocked();
    }
    const isAllowlisted = this.destinationAllowlist.has(baseUrl.origin);
    if (baseUrl.port && baseUrl.port !== "443" && !isAllowlisted) {
      throw destinationBlocked();
    }
    let addresses: string[];
    try {
      addresses = await this.destinationResolver(baseUrl.hostname);
    } catch {
      throw destinationBlocked();
    }
    if (
      addresses.length === 0 ||
      (!isAllowlisted &&
        addresses.some((candidate) => !isPublicIpAddress(candidate)))
    ) {
      throw destinationBlocked();
    }
    const [address] = addresses;
    if (!address) throw destinationBlocked();
    const normalizedBase = baseUrl.pathname.endsWith("/")
      ? baseUrl
      : new URL(`${baseUrl.toString()}/`);
    return { url: new URL(endpoint, normalizedBase), address };
  }

  private async withProviderCredential<T>(
    provider: ProviderRow,
    operation: (credential: string) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.useProviderCredential(
        provider.id,
        async (credential) => {
          if (!credential) {
            throw new ModelAdminError(
              "VALIDATION",
              "Provider has no usable credential",
            );
          }
          return operation(credential);
        },
      );
    } catch (error) {
      if (error instanceof ModelAdminError) throw error;
      if (isTimeoutError(error)) {
        throw new ModelAdminError("TIMEOUT", "Provider request timed out", {
          retryable: true,
        });
      }
      throw new ModelAdminError(
        "UPSTREAM_UNAVAILABLE",
        "Provider request could not be completed",
        { retryable: true },
      );
    }
  }

  private async toProviderPublic(
    provider: ProviderRow,
    repository: ModelAdminRepository = this.repository,
  ): Promise<ProviderPublic> {
    const modelCount = await repository.countModelsByProvider(provider.id);
    const hasStoredSecret = provider.credentialEnvelope !== null;
    return {
      id: provider.id,
      name: provider.name,
      provider: provider.provider,
      baseUrl: provider.baseUrl,
      isDefault: provider.isDefault,
      hasStoredSecret,
      credentialStatus: hasStoredSecret ? "configured" : "missing",
      modelCount,
      revision: provider.revision,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private encryptCreateCredential(
    provider: string,
    credential: CreateProviderInput["credential"],
  ): string | null {
    if (!credential) {
      if (isExplicitlyUnauthenticatedAdapter(provider)) return null;
      throw new ModelAdminError(
        "VALIDATION",
        "This provider adapter requires a credential replacement command",
      );
    }
    if (credential.kind !== "replace") {
      throw new ModelAdminError(
        "VALIDATION",
        "Provider creation only accepts a credential replacement command",
      );
    }
    return encryptProviderSecret(
      requireText(credential.value, "credential"),
      this.getEncryptionKey(),
    );
  }

  private resolveCredentialUpdate(
    current: string | null,
    credential: CredentialCommand | undefined,
  ): string | null {
    if (!credential || credential.kind === "preserve") return current;
    if (credential.kind === "remove") return null;
    return encryptProviderSecret(
      requireText(credential.value, "credential"),
      this.getEncryptionKey(),
    );
  }

  private getEncryptionKey(): Buffer {
    return this.encryptionKey ?? parseProviderEncryptionKey();
  }

  private async inTransaction<T>(
    operation: (repository: ModelAdminRepository) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.repository.transaction(operation);
    } catch (error) {
      if (error instanceof ModelAdminError) throw error;
      const databaseCode =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: unknown }).code
          : undefined;
      if (databaseCode === "23505" || databaseCode === "23503") {
        throw new ModelAdminError(
          "CONFLICT",
          "Registry data conflicts with an existing record",
        );
      }
      throw new ModelAdminError(
        "INTERNAL",
        "Registry operation could not be completed",
        {
          retryable: true,
        },
      );
    }
  }
}

function requireText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ModelAdminError("VALIDATION", `${field} is required`);
  return trimmed;
}

function requireIdentifier(value: string, field: string): string {
  return requireText(value, field);
}

function optionalText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isExplicitlyUnauthenticatedAdapter(adapter: string): boolean {
  return UNAUTHENTICATED_PROVIDER_ADAPTERS.has(adapter.trim().toLowerCase());
}

function toModelWrite(
  input: SaveModelInput,
  current: ModelRow | undefined,
  providerId: string,
  modelId: string,
): Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt"> {
  const defaults: ModelSettings = {
    displayName: null,
    family: null,
    canonicalSlug: null,
    description: null,
    contextLength: null,
    maxCompletionTokens: null,
    knowledgeCutoff: null,
    expirationDate: null,
    architecture: null,
    reasoning: null,
    supportedParameters: null,
    defaultParameters: null,
    perRequestLimits: null,
    pricing: null,
    requestOptions: null,
    reasoningApiId: null,
  };
  const value = <Key extends keyof ModelSettings>(
    key: Key,
  ): ModelSettings[Key] =>
    input[key] !== undefined
      ? (input[key] as ModelSettings[Key])
      : ((current?.[key] ?? defaults[key]) as ModelSettings[Key]);
  return {
    providerId,
    modelId,
    enabled: input.enabled ?? current?.enabled ?? true,
    displayName: value("displayName"),
    family: value("family"),
    canonicalSlug: value("canonicalSlug"),
    description: value("description"),
    contextLength: value("contextLength"),
    maxCompletionTokens: value("maxCompletionTokens"),
    knowledgeCutoff: value("knowledgeCutoff"),
    expirationDate: value("expirationDate"),
    architecture: value("architecture"),
    reasoning: value("reasoning"),
    supportedParameters: value("supportedParameters"),
    defaultParameters: value("defaultParameters"),
    perRequestLimits: value("perRequestLimits"),
    pricing: value("pricing"),
    requestOptions: value("requestOptions"),
    reasoningApiId: value("reasoningApiId"),
  };
}

function sameModelValues(
  current: ModelRow,
  next: Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">,
): boolean {
  if (
    current.providerId !== next.providerId ||
    current.modelId !== next.modelId ||
    current.enabled !== next.enabled
  ) {
    return false;
  }
  return MODEL_SETTING_KEYS.every(
    (key) => JSON.stringify(current[key]) === JSON.stringify(next[key]),
  );
}

function assertExpectedRevision(
  expected: number | undefined,
  current: number,
): void {
  if (expected !== current) {
    throw new ModelAdminError(
      "CONFLICT",
      "Record was changed by another request",
      {
        currentRevision: current,
      },
    );
  }
}

function normalizeAlias(value: string): {
  alias: string;
  aliasNormalized: string;
} {
  const alias = requireText(value, "alias").normalize("NFKC");
  return { alias, aliasNormalized: alias.toLowerCase() };
}

function normalizeAliases(
  values: string[],
): Array<{ alias: string; aliasNormalized: string }> {
  const aliases = values.map(normalizeAlias);
  const duplicates = new Set<string>();
  for (const alias of aliases) {
    if (duplicates.has(alias.aliasNormalized)) {
      throw new ModelAdminError(
        "CONFLICT",
        "Alias is duplicated after normalization",
      );
    }
    duplicates.add(alias.aliasNormalized);
  }
  return aliases;
}

async function assertAliasesAvailable(
  repository: ModelAdminRepository,
  aliases: Array<{ alias: string; aliasNormalized: string }>,
  ignoredAliasIds: Set<string>,
  provider: ProviderRow,
  modelId: string,
): Promise<void> {
  const models = await repository.listModels();
  const modelKeys = new Set<string>();
  for (const model of models) {
    const modelProvider = await repository.getProvider(model.providerId);
    if (!modelProvider) continue;
    modelKeys.add(normalizeRouteKey(modelProvider.name, model.modelId));
    modelKeys.add(normalizeModelId(model.modelId));
  }
  modelKeys.add(normalizeRouteKey(provider.name, modelId));
  modelKeys.add(normalizeModelId(modelId));
  const existing = await repository.listAliases();
  for (const alias of aliases) {
    if (modelKeys.has(alias.aliasNormalized)) {
      throw new ModelAdminError(
        "CONFLICT",
        "Alias conflicts with a routable model",
      );
    }
    const conflict = existing.find(
      (item) =>
        item.aliasNormalized === alias.aliasNormalized &&
        !ignoredAliasIds.has(item.id),
    );
    if (conflict) throw new ModelAdminError("CONFLICT", "Alias already exists");
  }
}

function normalizeRouteKey(providerName: string, modelId: string): string {
  return `${providerName}/${modelId}`.normalize("NFKC").trim().toLowerCase();
}

function normalizeModelId(modelId: string): string {
  return modelId.normalize("NFKC").trim().toLowerCase();
}

function sameAliasSet(
  current: AliasRow[],
  next: Array<{ alias: string; aliasNormalized: string }>,
): boolean {
  if (current.length !== next.length) return false;
  const currentKeys = current
    .map((alias) => `${alias.alias}\u0000${alias.aliasNormalized}`)
    .sort();
  const nextKeys = next
    .map((alias) => `${alias.alias}\u0000${alias.aliasNormalized}`)
    .sort();
  return currentKeys.every((key, index) => key === nextKeys[index]);
}

async function insertAliases(
  repository: ModelAdminRepository,
  aliases: Array<{ alias: string; aliasNormalized: string }>,
  targetModelId: string,
): Promise<void> {
  for (const alias of aliases) {
    await repository.insertAlias({ ...alias, targetModelId });
  }
}

async function throwModelConflict(
  repository: ModelAdminRepository,
  id: string,
): Promise<never> {
  const current = await repository.getModel(id);
  throw new ModelAdminError(
    "CONFLICT",
    "Model was changed by another request",
    {
      currentRevision: current?.revision,
    },
  );
}

async function throwProviderConflict(
  repository: ModelAdminRepository,
  id: string,
): Promise<never> {
  const current = await repository.getProvider(id);
  throw new ModelAdminError(
    "CONFLICT",
    "Provider was changed by another request",
    {
      currentRevision: current?.revision,
    },
  );
}

function toAliasPublic(alias: AliasRow): AliasPublic {
  return {
    id: alias.id,
    alias: alias.alias,
    aliasNormalized: alias.aliasNormalized,
    targetModelId: alias.targetModelId,
    revision: alias.revision,
    createdAt: alias.createdAt,
    updatedAt: alias.updatedAt,
  };
}

function toModelSummary(
  model: ModelRow,
  providerName: string | undefined,
): ModelSummary {
  if (!providerName)
    throw new ModelAdminError("INTERNAL", "Model provider is unavailable");
  return {
    id: model.id,
    providerId: model.providerId,
    providerName,
    modelId: model.modelId,
    displayName: model.displayName,
    family: model.family,
    canonicalSlug: model.canonicalSlug,
    description: model.description,
    contextLength: model.contextLength,
    maxCompletionTokens: model.maxCompletionTokens,
    knowledgeCutoff: model.knowledgeCutoff,
    expirationDate: model.expirationDate,
    architecture: model.architecture,
    reasoning: model.reasoning,
    supportedParameters: model.supportedParameters,
    defaultParameters: model.defaultParameters,
    perRequestLimits: model.perRequestLimits,
    pricing: model.pricing,
    requestOptions: model.requestOptions,
    reasoningApiId: model.reasoningApiId,
    enabled: model.enabled,
    revision: model.revision,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}

function detailFromRows(
  model: ModelRow,
  providerName: string,
  aliases: AliasRow[],
): ModelDetail {
  return {
    ...toModelSummary(model, providerName),
    aliases: aliases.map(toAliasPublic),
  };
}

function readDestinationAllowlist(): string[] {
  return (process.env.PROVIDER_DESTINATION_ALLOWLIST ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeAllowedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

async function resolveDnsAddresses(hostname: string): Promise<string[]> {
  return (await lookupDns(hostname, { all: true, verbatim: true })).map(
    ({ address }) => address,
  );
}

function destinationBlocked(): ModelAdminError {
  return new ModelAdminError(
    "DESTINATION_BLOCKED",
    "Provider destination is not allowed",
  );
}

function isPublicIpAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const parts = address.split(".").map(Number);
    const [first, second] = parts;
    if (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 &&
        (second === 0 || second === 168 || second === 2 || second === 88)) ||
      (first === 198 && (second === 18 || second === 19 || second === 51)) ||
      (first === 203 && second === 0)
    ) {
      return false;
    }
    return true;
  }
  if (isIP(address) === 6) {
    return ![
      "::/128",
      "::1/128",
      "::ffff:0:0/96",
      "64:ff9b:1::/48",
      "100::/64",
      "100:0:0:1::/64",
      "2001::/23",
      "2001:2::/48",
      "2001:10::/28",
      "2001:20::/28",
      "2001:db8::/32",
      "2002::/16",
      "3fff::/20",
      "fc00::/7",
      "fe80::/10",
      "ff00::/8",
    ].some((cidr) => isIpv6InCidr(address, cidr));
  }
  return false;
}

function isIpv6InCidr(address: string, cidr: string): boolean {
  const [network, prefixText] = cidr.split("/");
  if (!network || !prefixText) return false;
  const prefix = Number(prefixText);
  const addressValue = ipv6ToBigInt(address);
  const networkValue = ipv6ToBigInt(network);
  if (
    addressValue === null ||
    networkValue === null ||
    prefix < 0 ||
    prefix > 128
  ) {
    return false;
  }
  const shift = 128n - BigInt(prefix);
  return addressValue >> shift === networkValue >> shift;
}

function ipv6ToBigInt(value: string): bigint | null {
  let normalized = value.toLowerCase();
  if (normalized.includes(".")) {
    const separator = normalized.lastIndexOf(":");
    const ipv4 = normalized
      .slice(separator + 1)
      .split(".")
      .map(Number);
    if (
      separator < 0 ||
      ipv4.length !== 4 ||
      ipv4.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return null;
    }
    normalized = `${normalized.slice(0, separator + 1)}${((ipv4[0]! << 8) + ipv4[1]!).toString(16)}:${((ipv4[2]! << 8) + ipv4[3]!).toString(16)}`;
  }
  const sections = normalized.split("::");
  if (sections.length > 2) return null;
  const [left = "", right = ""] = sections;
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const omitted = 8 - leftParts.length - rightParts.length;
  if (omitted < 0 || (!normalized.includes("::") && omitted !== 0)) return null;
  const parts = [
    ...leftParts,
    ...Array.from({ length: omitted }, () => "0"),
    ...rightParts,
  ];
  if (
    parts.length !== 8 ||
    parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))
  ) {
    return null;
  }
  return parts.reduce(
    (result, part) => (result << 16n) + BigInt(`0x${part}`),
    0n,
  );
}

function authorizationHeaders(credential: string): Record<string, string> {
  return { authorization: `Bearer ${credential}`, accept: "application/json" };
}

function parseUpstreamJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw upstreamUnavailable();
  }
}

function parseDiscoveredModel(value: unknown): {
  modelId: string;
  displayName: string | null;
} {
  if (!value || typeof value !== "object") throw upstreamUnavailable();
  const record = value as {
    id?: unknown;
    display_name?: unknown;
    name?: unknown;
  };
  if (typeof record.id !== "string" || !record.id.trim()) {
    throw upstreamUnavailable();
  }
  const displayName = record.display_name ?? record.name;
  if (displayName !== undefined && typeof displayName !== "string") {
    throw upstreamUnavailable();
  }
  return {
    modelId: record.id.trim(),
    displayName: displayName?.trim() || null,
  };
}

function extractProbeContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw upstreamUnavailable();
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0)
    throw upstreamUnavailable();
  const content = (
    choices[0] as { message?: { content?: unknown } } | undefined
  )?.message?.content;
  if (typeof content !== "string") throw upstreamUnavailable();
  return content;
}

function truncateUtf8(
  value: string,
  maxBytes: number,
): { value: string; didTruncate: boolean } {
  const encoder = new TextEncoder();
  if (encoder.encode(value).byteLength <= maxBytes) {
    return { value, didTruncate: false };
  }
  let result = "";
  let size = 0;
  for (const character of value) {
    const characterSize = encoder.encode(character).byteLength;
    if (size + characterSize > maxBytes) break;
    result += character;
    size += characterSize;
  }
  return { value: result, didTruncate: true };
}

function assertUpstreamSuccess(response: {
  status: number;
  body: string;
}): void {
  if (Buffer.byteLength(response.body, "utf8") > MAX_UPSTREAM_BODY_BYTES) {
    throw upstreamUnavailable();
  }
  if (response.status >= 200 && response.status < 300) return;
  if (response.status === 429) {
    throw new ModelAdminError("RATE_LIMITED", "Provider rate limit reached", {
      retryable: true,
    });
  }
  throw upstreamUnavailable(response.status >= 500);
}

function upstreamUnavailable(retryable = true): ModelAdminError {
  return new ModelAdminError(
    "UPSTREAM_UNAVAILABLE",
    "Provider returned an unavailable or invalid response",
    { retryable },
  );
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof UpstreamTimeoutError ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

class UpstreamTimeoutError extends Error {
  constructor() {
    super("Provider request timed out");
    this.name = "UpstreamTimeoutError";
  }
}

class UpstreamBodyLimitError extends Error {
  constructor() {
    super("Provider response exceeded the allowed size");
    this.name = "UpstreamBodyLimitError";
  }
}

class NodeHttpsOpenAiCompatibleTransport implements OpenAiCompatibleTransport {
  async request(input: {
    method: "GET" | "POST";
    url: URL;
    address: string;
    headers: Record<string, string>;
    body?: string;
  }): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let connected = false;
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(connectTimer);
        clearTimeout(totalTimer);
        callback();
      };
      const fail = (error: Error) => settle(() => reject(error));
      const request = httpsRequest({
        protocol: "https:",
        hostname: input.url.hostname,
        port: input.url.port || 443,
        path: `${input.url.pathname}${input.url.search}`,
        method: input.method,
        headers: input.headers,
        agent: false,
        lookup: (_hostname, _options, callback) =>
          callback(null, input.address, isIP(input.address)),
      });
      const connectTimer = setTimeout(() => {
        if (!connected) {
          request.destroy(new UpstreamTimeoutError());
          fail(new UpstreamTimeoutError());
        }
      }, CONNECT_TIMEOUT_MS);
      const totalTimer = setTimeout(() => {
        request.destroy(new UpstreamTimeoutError());
        fail(new UpstreamTimeoutError());
      }, UPSTREAM_TIMEOUT_MS);
      request.on("socket", (socket) => {
        const markConnected = () => {
          connected = true;
          clearTimeout(connectTimer);
        };
        if (socket.connecting) socket.once("secureConnect", markConnected);
        else markConnected();
      });
      request.on("response", (response) => {
        const chunks: Buffer[] = [];
        let bodySize = 0;
        response.on("data", (chunk: Buffer) => {
          bodySize += chunk.length;
          if (bodySize > MAX_UPSTREAM_BODY_BYTES) {
            request.destroy(new UpstreamBodyLimitError());
            fail(new UpstreamBodyLimitError());
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", (error) => fail(error));
        response.on("end", () =>
          settle(() =>
            resolve({
              status: response.statusCode ?? 0,
              body: Buffer.concat(chunks).toString("utf8"),
            }),
          ),
        );
      });
      request.on("error", (error) => fail(error));
      request.end(input.body);
    });
  }
}

class DrizzleModelAdminRepository implements ModelAdminRepository {
  constructor(private readonly db: DatabaseClient) {}

  async transaction<T>(
    operation: (repository: ModelAdminRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (transaction) =>
      operation(
        new DrizzleModelAdminRepository(
          transaction as unknown as DatabaseClient,
        ),
      ),
    );
  }

  async getProvider(id: string): Promise<ProviderRow | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.id, id))
      .limit(1);
    return row ?? null;
  }

  async getProviderByName(name: string): Promise<ProviderRow | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, name))
      .limit(1);
    return row ?? null;
  }

  async listProviders(): Promise<ProviderRow[]> {
    return this.db
      .select()
      .from(modelProxyProviders)
      .orderBy(asc(modelProxyProviders.name));
  }

  async insertProvider(
    input: Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<ProviderRow> {
    const [row] = await this.db
      .insert(modelProxyProviders)
      .values(input)
      .returning();
    if (!row)
      throw new ModelAdminError("INTERNAL", "Provider could not be saved");
    return row;
  }

  async updateProviderIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ): Promise<ProviderRow | null> {
    const [row] = await this.db
      .update(modelProxyProviders)
      .set({ ...input, revision: expectedRevision + 1, updatedAt: new Date() })
      .where(
        and(
          eq(modelProxyProviders.id, id),
          eq(modelProxyProviders.revision, expectedRevision),
        ),
      )
      .returning();
    return row ?? null;
  }

  async clearDefaultProviders(exceptId?: string): Promise<void> {
    const predicate = exceptId
      ? and(
          eq(modelProxyProviders.isDefault, true),
          ne(modelProxyProviders.id, exceptId),
        )
      : eq(modelProxyProviders.isDefault, true);
    await this.db
      .update(modelProxyProviders)
      .set({
        isDefault: false,
        revision: sql`${modelProxyProviders.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(predicate);
  }

  async countModelsByProvider(providerId: string): Promise<number> {
    return (
      await this.db
        .select()
        .from(modelProxyModels)
        .where(eq(modelProxyModels.providerId, providerId))
    ).length;
  }

  async deleteProvider(id: string): Promise<boolean> {
    return (
      (
        await this.db
          .delete(modelProxyProviders)
          .where(eq(modelProxyProviders.id, id))
          .returning({ id: modelProxyProviders.id })
      ).length > 0
    );
  }

  async getModel(id: string): Promise<ModelRow | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.id, id))
      .limit(1);
    return row ?? null;
  }

  async getModelByProviderAndModelId(
    providerId: string,
    modelId: string,
  ): Promise<ModelRow | null> {
    const [row] = await this.db
      .select()
      .from(modelProxyModels)
      .where(
        and(
          eq(modelProxyModels.providerId, providerId),
          eq(modelProxyModels.modelId, modelId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listModels(): Promise<ModelRow[]> {
    return this.db.select().from(modelProxyModels);
  }

  async insertModel(
    input: Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<ModelRow> {
    const [row] = await this.db
      .insert(modelProxyModels)
      .values(input)
      .returning();
    if (!row) throw new ModelAdminError("INTERNAL", "Model could not be saved");
    return row;
  }

  async updateModelIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ): Promise<ModelRow | null> {
    const [row] = await this.db
      .update(modelProxyModels)
      .set({ ...input, revision: expectedRevision + 1, updatedAt: new Date() })
      .where(
        and(
          eq(modelProxyModels.id, id),
          eq(modelProxyModels.revision, expectedRevision),
        ),
      )
      .returning();
    return row ?? null;
  }

  async deleteModelIfRevision(
    id: string,
    expectedRevision: number,
  ): Promise<boolean | "conflict"> {
    const deleted = await this.db
      .delete(modelProxyModels)
      .where(
        and(
          eq(modelProxyModels.id, id),
          eq(modelProxyModels.revision, expectedRevision),
        ),
      )
      .returning({ id: modelProxyModels.id });
    if (deleted.length > 0) return true;
    return (await this.getModel(id)) ? "conflict" : false;
  }

  async listAliases(): Promise<AliasRow[]> {
    return this.db.select().from(modelProxyAliases);
  }

  async listAliasesForModel(modelId: string): Promise<AliasRow[]> {
    return this.db
      .select()
      .from(modelProxyAliases)
      .where(eq(modelProxyAliases.targetModelId, modelId));
  }

  async insertAlias(
    input: Omit<AliasRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ): Promise<AliasRow> {
    const [row] = await this.db
      .insert(modelProxyAliases)
      .values(input)
      .returning();
    if (!row) throw new ModelAdminError("INTERNAL", "Alias could not be saved");
    return row;
  }

  async updateAliasIfRevision(
    id: string,
    expectedRevision: number,
    input: Pick<AliasRow, "alias" | "aliasNormalized" | "targetModelId">,
  ): Promise<AliasRow | null> {
    const [row] = await this.db
      .update(modelProxyAliases)
      .set({ ...input, revision: expectedRevision + 1, updatedAt: new Date() })
      .where(
        and(
          eq(modelProxyAliases.id, id),
          eq(modelProxyAliases.revision, expectedRevision),
        ),
      )
      .returning();
    return row ?? null;
  }

  async deleteAliasIfRevision(
    id: string,
    expectedRevision: number,
  ): Promise<boolean | "conflict"> {
    const deleted = await this.db
      .delete(modelProxyAliases)
      .where(
        and(
          eq(modelProxyAliases.id, id),
          eq(modelProxyAliases.revision, expectedRevision),
        ),
      )
      .returning({ id: modelProxyAliases.id });
    if (deleted.length > 0) return true;
    return (
      await this.db
        .select()
        .from(modelProxyAliases)
        .where(eq(modelProxyAliases.id, id))
        .limit(1)
    ).length > 0
      ? "conflict"
      : false;
  }

  async deleteAliasesForModel(modelId: string): Promise<void> {
    await this.db
      .delete(modelProxyAliases)
      .where(eq(modelProxyAliases.targetModelId, modelId));
  }
}
