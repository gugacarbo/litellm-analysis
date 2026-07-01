import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type {
  OpenAiOAuthAuthenticatedRequestConfig,
  OpenAiOAuthConnectionStatus,
  OpenAiOAuthConnectionTokens,
  OpenAiOAuthDeviceCodePollResult,
  OpenAiOAuthDeviceCodeStartResult,
  OpenAiOAuthEncryptedConnection,
} from "../types/openai-oauth.js";
import {
  OPENAI_CHATGPT_API_BASE,
  OPENAI_CHATGPT_CLIENT_ID,
  OPENAI_CHATGPT_DEVICE_CODE_URL,
  OPENAI_CHATGPT_DEVICE_TOKEN_URL,
  OPENAI_CHATGPT_DEVICE_VERIFY_URL,
  OPENAI_CHATGPT_OAUTH_TOKEN_URL,
  OPENAI_OAUTH_REFRESH_SKEW_SECONDS,
} from "../types/openai-oauth.js";
import { SETTING_KEYS } from "../types/settings.js";
import type { ISettingsService } from "./settings.service.js";
import {
  SettingsService,
  type SettingsServiceOptions,
} from "./settings.service.js";

const DEFAULT_ORIGINATOR = "codex_cli_rs";
const DEFAULT_USER_AGENT = "hebo_ai_gateway/0.1.0";

function parseEncryptionKey(raw: string | undefined): Buffer {
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new Error(
      "MODEL_PROXY_OAUTH_ENCRYPTION_KEY is required for OpenAI OAuth",
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

function encryptJson(
  payload: OpenAiOAuthConnectionTokens,
  secret: Buffer,
): OpenAiOAuthEncryptedConnection {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const cipherText = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    version: 1,
    cipherText: cipherText.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
  };
}

function decryptJson(
  payload: OpenAiOAuthEncryptedConnection,
  secret: Buffer,
): OpenAiOAuthConnectionTokens {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    secret,
    Buffer.from(payload.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, "base64url")),
    decipher.final(),
  ]).toString("utf8");

  const parsed = JSON.parse(plaintext) as Partial<OpenAiOAuthConnectionTokens>;
  if (
    !parsed.accessToken ||
    !parsed.refreshToken ||
    typeof parsed.expiresAt !== "number"
  ) {
    throw new Error("Stored OpenAI OAuth connection is invalid");
  }

  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    idToken: parsed.idToken ?? null,
    accountId: parsed.accountId ?? null,
    expiresAt: parsed.expiresAt,
  };
}

function decodeJwtClaims(
  token: string | null | undefined,
): Record<string, unknown> {
  if (!token) {
    return {};
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return {};
    }

    const payload = parts[1];
    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getTokenExpiry(token: string): number | null {
  const claims = decodeJwtClaims(token);
  return typeof claims.exp === "number" ? claims.exp : null;
}

function getAccountId(tokens: {
  accessToken: string;
  idToken: string | null;
}): string | null {
  for (const token of [tokens.idToken, tokens.accessToken]) {
    const claims = decodeJwtClaims(token);
    const authClaims = claims["https://api.openai.com/auth"];
    if (typeof authClaims !== "object" || authClaims === null) {
      continue;
    }

    const accountId = (authClaims as Record<string, unknown>)
      .chatgpt_account_id;
    if (typeof accountId === "string" && accountId.trim()) {
      return accountId.trim();
    }
  }

  return null;
}

function sanitizeHeaderValue(value: string): string {
  return value
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126 ? char : "_";
    })
    .join("");
}

function buildAuthHeaders(params: {
  accessToken: string;
  accountId: string | null;
  sessionId: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.accessToken}`,
    accept: "text/event-stream",
    "content-type": "application/json",
    originator: DEFAULT_ORIGINATOR,
    "user-agent": DEFAULT_USER_AGENT,
    session_id: sanitizeHeaderValue(params.sessionId),
  };

  if (params.accountId) {
    headers["ChatGPT-Account-Id"] = params.accountId;
  }

  return headers;
}

export interface OpenAiOAuthServiceOptions extends SettingsServiceOptions {
  settingsService?: ISettingsService;
}

export interface IOpenAiOAuthService {
  getConnectionStatus(): Promise<OpenAiOAuthConnectionStatus>;
  startDeviceAuthorization(): Promise<OpenAiOAuthDeviceCodeStartResult>;
  pollDeviceAuthorization(input: {
    deviceAuthId: string;
    userCode: string;
  }): Promise<OpenAiOAuthDeviceCodePollResult>;
  disconnect(): Promise<void>;
  getAuthenticatedRequestConfig(): Promise<OpenAiOAuthAuthenticatedRequestConfig>;
  discoverModels(): Promise<{ id: string; ownedBy?: string }[]>;
}

export class OpenAiOAuthService implements IOpenAiOAuthService {
  private readonly settingsService: ISettingsService;
  private readonly encryptionKey: Buffer;

  constructor(options: OpenAiOAuthServiceOptions = {}) {
    this.settingsService =
      options.settingsService ?? new SettingsService(options);
    this.encryptionKey = parseEncryptionKey(
      process.env.MODEL_PROXY_OAUTH_ENCRYPTION_KEY,
    );
  }

  async getConnectionStatus(): Promise<OpenAiOAuthConnectionStatus> {
    const tokens = await this.readTokens({ refreshIfNeeded: false });
    if (!tokens) {
      return {
        connected: false,
        accountId: null,
        expiresAt: null,
        baseUrl: OPENAI_CHATGPT_API_BASE,
      };
    }

    return {
      connected: true,
      accountId: tokens.accountId,
      expiresAt: new Date(tokens.expiresAt * 1000).toISOString(),
      baseUrl: OPENAI_CHATGPT_API_BASE,
    };
  }

  async startDeviceAuthorization(): Promise<OpenAiOAuthDeviceCodeStartResult> {
    const response = await fetch(OPENAI_CHATGPT_DEVICE_CODE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ client_id: OPENAI_CHATGPT_CLIENT_ID }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start OpenAI device authorization (${response.status})`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const deviceAuthId =
      typeof json.device_auth_id === "string" ? json.device_auth_id : null;
    const userCode =
      typeof json.user_code === "string"
        ? json.user_code
        : typeof json.usercode === "string"
          ? json.usercode
          : null;
    const intervalSeconds =
      typeof json.interval === "number" && Number.isFinite(json.interval)
        ? json.interval
        : 5;
    const expiresInSeconds =
      typeof json.expires_in === "number" && Number.isFinite(json.expires_in)
        ? json.expires_in
        : 15 * 60;

    if (!deviceAuthId || !userCode) {
      throw new Error("OpenAI device authorization response was incomplete");
    }

    return {
      deviceAuthId,
      userCode,
      verificationUri: OPENAI_CHATGPT_DEVICE_VERIFY_URL,
      intervalSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async pollDeviceAuthorization(input: {
    deviceAuthId: string;
    userCode: string;
  }): Promise<OpenAiOAuthDeviceCodePollResult> {
    const response = await fetch(OPENAI_CHATGPT_DEVICE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        device_auth_id: input.deviceAuthId,
        user_code: input.userCode,
      }),
    });

    if (response.status === 403 || response.status === 404) {
      return {
        status: "pending",
        intervalSeconds: 5,
      };
    }

    if (!response.ok) {
      throw new Error(
        `Failed to poll OpenAI device authorization (${response.status})`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const authorizationCode =
      typeof json.authorization_code === "string"
        ? json.authorization_code
        : null;
    const codeVerifier =
      typeof json.code_verifier === "string" ? json.code_verifier : null;

    if (!authorizationCode || !codeVerifier) {
      return {
        status: "pending",
        intervalSeconds: 5,
      };
    }

    const tokens = await this.exchangeAuthorizationCode({
      authorizationCode,
      codeVerifier,
    });
    await this.writeTokens(tokens);

    return {
      status: "approved",
      connection: {
        connected: true,
        accountId: tokens.accountId,
        expiresAt: new Date(tokens.expiresAt * 1000).toISOString(),
        baseUrl: OPENAI_CHATGPT_API_BASE,
      },
    };
  }

  async disconnect(): Promise<void> {
    await this.settingsService.deleteByKey(
      SETTING_KEYS.OPENAI_OAUTH_CONNECTION,
    );
  }

  async getAuthenticatedRequestConfig(): Promise<OpenAiOAuthAuthenticatedRequestConfig> {
    const tokens = await this.ensureValidTokens();
    const sessionId = randomUUID();

    return {
      accessToken: tokens.accessToken,
      accountId: tokens.accountId,
      baseUrl: OPENAI_CHATGPT_API_BASE,
      headers: buildAuthHeaders({
        accessToken: tokens.accessToken,
        accountId: tokens.accountId,
        sessionId,
      }),
      sessionId,
    };
  }

  async discoverModels(): Promise<{ id: string; ownedBy?: string }[]> {
    const tokens = await this.ensureValidTokens();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `OpenAI /v1/models returned ${response.status}: ${body.slice(0, 300)}`,
        );
      }

      const json = (await response.json()) as {
        data?: Array<{ id: string; owned_by?: string }>;
      };

      const models = Array.isArray(json.data) ? json.data : [];
      return models.map((model) => ({
        id: model.id,
        ownedBy: model.owned_by ?? "chatgpt-subscription",
      }));
    } catch (error) {
      throw new Error(
        `Failed to discover OpenAI models: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async ensureValidTokens(): Promise<OpenAiOAuthConnectionTokens> {
    const tokens = await this.readTokens({ refreshIfNeeded: true });
    if (!tokens) {
      throw new Error("No OpenAI OAuth connection is configured");
    }
    return tokens;
  }

  private async readTokens(options: {
    refreshIfNeeded: boolean;
  }): Promise<OpenAiOAuthConnectionTokens | null> {
    const row = await this.settingsService.getByKey(
      SETTING_KEYS.OPENAI_OAUTH_CONNECTION,
    );
    if (!row || typeof row.value !== "object" || row.value === null) {
      return null;
    }

    let encrypted: OpenAiOAuthEncryptedConnection;
    try {
      encrypted = row.value as OpenAiOAuthEncryptedConnection;
      const tokens = decryptJson(encrypted, this.encryptionKey);
      if (!options.refreshIfNeeded || !this.shouldRefresh(tokens.expiresAt)) {
        return tokens;
      }

      const refreshed = await this.refreshTokens(tokens);
      await this.writeTokens(refreshed);
      return refreshed;
    } catch (error) {
      await this.settingsService.deleteByKey(
        SETTING_KEYS.OPENAI_OAUTH_CONNECTION,
      );
      throw error;
    }
  }

  private async writeTokens(
    tokens: OpenAiOAuthConnectionTokens,
  ): Promise<void> {
    await this.settingsService.upsertByKey(
      SETTING_KEYS.OPENAI_OAUTH_CONNECTION,
      encryptJson(tokens, this.encryptionKey),
    );
  }

  private shouldRefresh(expiresAt: number): boolean {
    return Date.now() / 1000 >= expiresAt - OPENAI_OAUTH_REFRESH_SKEW_SECONDS;
  }

  private async exchangeAuthorizationCode(input: {
    authorizationCode: string;
    codeVerifier: string;
  }): Promise<OpenAiOAuthConnectionTokens> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.authorizationCode,
      redirect_uri: "https://auth.openai.com/deviceauth/callback",
      client_id: OPENAI_CHATGPT_CLIENT_ID,
      code_verifier: input.codeVerifier,
    });

    const response = await fetch(OPENAI_CHATGPT_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to exchange OpenAI authorization code (${response.status})`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    return this.normalizeTokens(json, null);
  }

  private async refreshTokens(
    current: OpenAiOAuthConnectionTokens,
  ): Promise<OpenAiOAuthConnectionTokens> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
      client_id: OPENAI_CHATGPT_CLIENT_ID,
    });

    const response = await fetch(OPENAI_CHATGPT_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to refresh OpenAI OAuth token (${response.status})`,
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    return this.normalizeTokens(json, current);
  }

  private normalizeTokens(
    payload: Record<string, unknown>,
    previous: OpenAiOAuthConnectionTokens | null,
  ): OpenAiOAuthConnectionTokens {
    const accessToken =
      typeof payload.access_token === "string" ? payload.access_token : null;
    const refreshToken =
      typeof payload.refresh_token === "string"
        ? payload.refresh_token
        : (previous?.refreshToken ?? null);
    const idToken =
      typeof payload.id_token === "string"
        ? payload.id_token
        : (previous?.idToken ?? null);

    if (!accessToken || !refreshToken) {
      throw new Error("OpenAI OAuth token response was incomplete");
    }

    const expiresIn =
      typeof payload.expires_in === "number" &&
      Number.isFinite(payload.expires_in)
        ? payload.expires_in
        : null;
    const expiresAt =
      expiresIn !== null
        ? Math.floor(Date.now() / 1000) + expiresIn
        : getTokenExpiry(accessToken);

    if (!expiresAt) {
      throw new Error("Could not determine OpenAI OAuth token expiry");
    }

    const accountId =
      getAccountId({ accessToken, idToken }) ?? previous?.accountId ?? null;

    return {
      accessToken,
      refreshToken,
      idToken,
      accountId,
      expiresAt,
    };
  }
}
