import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const PROVIDER_SECRET_PREFIX = "enc:v1:";

type EncryptedProviderSecret = {
  version: 1;
  cipherText: string;
  iv: string;
  tag: string;
};

export function isEncryptedProviderSecret(value: string): boolean {
  return value.startsWith(PROVIDER_SECRET_PREFIX);
}

export function parseProviderEncryptionKey(
  env: NodeJS.ProcessEnv = process.env,
): Buffer {
  const trimmed = env.APP_ENCRYPTION_KEY?.trim();
  if (!trimmed) {
    throw new Error(
      "APP_ENCRYPTION_KEY is required for encrypted provider storage",
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

export function encryptProviderSecretIfPlain(
  secret: string,
  encryptionKey: Buffer,
): string {
  if (isEncryptedProviderSecret(secret)) {
    return secret;
  }
  return encryptProviderSecret(secret, encryptionKey);
}

export function encryptProviderSecret(
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

  const payload: EncryptedProviderSecret = {
    version: 1,
    cipherText: cipherText.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
  };

  return `${PROVIDER_SECRET_PREFIX}${Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url")}`;
}

export function decryptProviderSecret(
  storedSecret: string,
  encryptionKey: Buffer,
): string {
  if (!isEncryptedProviderSecret(storedSecret)) {
    return storedSecret;
  }

  const encodedPayload = storedSecret.slice(PROVIDER_SECRET_PREFIX.length);
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as Partial<EncryptedProviderSecret>;

  if (
    payload.version !== 1 ||
    !payload.cipherText ||
    !payload.iv ||
    !payload.tag
  ) {
    throw new Error("Stored provider secret is invalid");
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

export function resolveProviderApiKey(
  input: {
    apiKey?: string | null;
  },
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const storedApiKey = input.apiKey?.trim();
  if (!storedApiKey) {
    return undefined;
  }

  if (!isEncryptedProviderSecret(storedApiKey)) {
    return storedApiKey;
  }

  return decryptProviderSecret(storedApiKey, parseProviderEncryptionKey(env));
}

export function hasStoredProviderSecret(input: {
  apiKey?: string | null;
}): boolean {
  return Boolean(input.apiKey?.trim());
}