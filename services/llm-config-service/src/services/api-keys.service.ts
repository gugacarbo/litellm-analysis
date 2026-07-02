import { randomBytes } from "node:crypto";
import type { DatabaseClient } from "@lite-llm/database/client";
import bcrypt from "bcryptjs";
import { ApiKeysRepository } from "../repositories/api-keys-repository.js";
import type {
  ApiKeyCreateInput,
  ApiKeyRecord,
  ApiKeyVerifyResult,
  CreatedApiKey,
} from "../types/api-keys.js";

export interface ApiKeysServiceOptions {
  prisma?: DatabaseClient;
  repository?: ApiKeysRepository;
  hashKey?: (plainKey: string) => Promise<string>;
  verifyKey?: (hash: string, plainKey: string) => Promise<boolean>;
  generateKey?: () => string;
}

function defaultGenerateKey(): string {
  return `mp_${randomBytes(32).toString("base64url")}`;
}

async function defaultHashKey(plainKey: string): Promise<string> {
  return bcrypt.hash(plainKey, 12);
}

async function defaultVerifyKey(
  hash: string,
  plainKey: string,
): Promise<boolean> {
  return bcrypt.compare(plainKey, hash);
}

export interface IApiKeysService {
  list(): Promise<ApiKeyRecord[]>;
  get(id: string): Promise<ApiKeyRecord | null>;
  create(input: ApiKeyCreateInput, plainKey?: string): Promise<CreatedApiKey>;
  enable(id: string): Promise<ApiKeyRecord>;
  disable(id: string): Promise<ApiKeyRecord>;
  delete(id: string): Promise<boolean>;
  verify(plainKey: string): Promise<ApiKeyVerifyResult>;
}

export class ApiKeysService implements IApiKeysService {
  private readonly repository: ApiKeysRepository;
  private readonly hashKey: (plainKey: string) => Promise<string>;
  private readonly verifyKey: (
    hash: string,
    plainKey: string,
  ) => Promise<boolean>;
  private readonly generateKey: () => string;

  constructor(options: ApiKeysServiceOptions = {}) {
    this.repository =
      options.repository ??
      new ApiKeysRepository(
        options.prisma ??
          (() => {
            throw new Error("ApiKeysService requires prisma or repository");
          })(),
      );
    this.hashKey = options.hashKey ?? defaultHashKey;
    this.verifyKey = options.verifyKey ?? defaultVerifyKey;
    this.generateKey = options.generateKey ?? defaultGenerateKey;
  }

  async list(): Promise<ApiKeyRecord[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<ApiKeyRecord | null> {
    return this.repository.findById(id);
  }

  async create(
    input: ApiKeyCreateInput,
    plainKey?: string,
  ): Promise<CreatedApiKey> {
    const label = input.label.trim();
    if (!label) {
      throw new Error("API key label must be a non-empty string");
    }

    const key = plainKey?.trim() || this.generateKey();
    if (!key) {
      throw new Error("API key must be a non-empty string");
    }

    const keyHash = await this.hashKey(key);
    const record = await this.repository.create({
      label,
      keyHash,
      enabled: input.enabled ?? true,
    });

    return { record, plainKey: key };
  }

  async enable(id: string): Promise<ApiKeyRecord> {
    const record = await this.repository.setEnabled(id, true);
    if (!record) {
      throw new Error(`API key "${id}" not found`);
    }
    return record;
  }

  async disable(id: string): Promise<ApiKeyRecord> {
    const record = await this.repository.setEnabled(id, false);
    if (!record) {
      throw new Error(`API key "${id}" not found`);
    }
    return record;
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async verify(plainKey: string): Promise<ApiKeyVerifyResult> {
    const trimmed = plainKey.trim();
    if (!trimmed) {
      return { valid: false };
    }

    const enabledKeys = await this.repository.listEnabled();
    for (const candidate of enabledKeys) {
      const matches = await this.verifyKey(candidate.keyHash, trimmed);
      if (!matches) {
        continue;
      }

      await this.repository.updateLastUsedAt(candidate.id, new Date());
      const refreshed = await this.repository.findById(candidate.id);
      return {
        valid: true,
        record: refreshed ?? candidate,
      };
    }

    return { valid: false };
  }
}
