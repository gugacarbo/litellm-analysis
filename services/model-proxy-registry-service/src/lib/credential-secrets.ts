import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const CREDENTIAL_SECRET_PREFIX = "enc:v1:";

type EncryptedCredentialSecret = {
  version: 1;
  cipherText: string;
  iv: string;
  tag: string;
};

export function looksLikeEnvVarName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

export function parseCredentialEncryptionKey(
  env: NodeJS.ProcessEnv = process.env,
): Buffer {
  const trimmed =
    env.MODEL_PROXY_CREDENTIAL_ENCRYPTION_KEY?.trim() ||
    env.MODEL_PROXY_OAUTH_ENCRYPTION_KEY?.trim();
  if (!trimmed) {
    throw new Error(
      "MODEL_PROXY_CREDENTIAL_ENCRYPTION_KEY or MODEL_PROXY_OAUTH_ENCRYPTION_KEY is required for encrypted credential storage",
    );
  }

  const utf8 = Buffer.from(trimmed, "utf8");
  if (utf8.length === 32) {
    return utf8;
  }

  for (const encoding of ["base64url", "base64"] as const) {
    try {
      const decoded = Buffer.from(trimmed, encoding);
      if (decoded.length === 32) {
        return decoded;
      }
    } catch {}
  }

  return createHash("sha256").update(trimmed).digest();
}

export function isEncryptedCredentialSecret(value: string): boolean {
  return value.startsWith(CREDENTIAL_SECRET_PREFIX);
}

export function encryptCredentialSecret(
  secret: string,
  encryptionKey: Buffer,
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const cipherText = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedCredentialSecret = {
    version: 1,
    cipherText: cipherText.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
  };

  return `${CREDENTIAL_SECRET_PREFIX}${Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url")}`;
}

export function decryptCredentialSecret(
  storedSecret: string,
  encryptionKey: Buffer,
): string {
  if (!isEncryptedCredentialSecret(storedSecret)) {
    return storedSecret;
  }

  const encodedPayload = storedSecret.slice(CREDENTIAL_SECRET_PREFIX.length);
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as Partial<EncryptedCredentialSecret>;

  if (
    payload.version !== 1 ||
    !payload.cipherText ||
    !payload.iv ||
    !payload.tag
  ) {
    throw new Error("Stored credential secret is invalid");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(payload.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function hasStoredCredentialSecret(input: {
  apiKey?: string | null;
  secretRef?: string | null;
}): boolean {
  return Boolean(input.apiKey?.trim() || input.secretRef?.trim());
}

export function resolveCredentialSecret(
  input: {
    apiKey?: string | null;
    secretRef?: string | null;
  },
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const storedApiKey = input.apiKey?.trim();
  if (storedApiKey) {
    if (isEncryptedCredentialSecret(storedApiKey)) {
      return decryptCredentialSecret(
        storedApiKey,
        parseCredentialEncryptionKey(env),
      );
    }
    return storedApiKey;
  }

  const secretRef = input.secretRef?.trim();
  if (!secretRef) {
    return undefined;
  }

  if (looksLikeEnvVarName(secretRef)) {
    const envValue = env[secretRef];
    return envValue?.trim() ? envValue.trim() : undefined;
  }

  return secretRef;
}
