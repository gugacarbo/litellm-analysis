export interface ApiKeyRecord {
  id: string;
  label: string;
  keyHash: string;
  enabled: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyCreateInput {
  label: string;
  enabled?: boolean;
}

export interface CreatedApiKey {
  record: ApiKeyRecord;
  /** Plaintext key — returned once at creation; never persisted. */
  plainKey: string;
}

export interface ApiKeyVerifyResult {
  valid: boolean;
  record?: ApiKeyRecord;
}
