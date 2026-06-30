export const OPENAI_CHATGPT_AUTH_BASE = "https://auth.openai.com";
export const OPENAI_CHATGPT_API_BASE = "https://chatgpt.com/backend-api/codex";
export const OPENAI_CHATGPT_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const OPENAI_CHATGPT_DEVICE_CODE_URL = `${OPENAI_CHATGPT_AUTH_BASE}/api/accounts/deviceauth/usercode`;
export const OPENAI_CHATGPT_DEVICE_TOKEN_URL = `${OPENAI_CHATGPT_AUTH_BASE}/api/accounts/deviceauth/token`;
export const OPENAI_CHATGPT_OAUTH_TOKEN_URL = `${OPENAI_CHATGPT_AUTH_BASE}/oauth/token`;
export const OPENAI_CHATGPT_DEVICE_VERIFY_URL = `${OPENAI_CHATGPT_AUTH_BASE}/codex/device`;

export const OPENAI_OAUTH_REFRESH_SKEW_SECONDS = 60;

export interface OpenAiOAuthConnectionTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string | null;
  accountId: string | null;
  expiresAt: number;
}

export interface OpenAiOAuthEncryptedConnection {
  version: 1;
  cipherText: string;
  iv: string;
  tag: string;
}

export interface OpenAiOAuthConnectionStatus {
  connected: boolean;
  accountId: string | null;
  expiresAt: string | null;
  baseUrl: string;
}

export interface OpenAiOAuthDeviceCodeStartResult {
  deviceAuthId: string;
  userCode: string;
  verificationUri: string;
  intervalSeconds: number;
  expiresAt: string;
}

export type OpenAiOAuthDeviceCodePollResult =
  | {
      status: "pending";
      intervalSeconds: number;
    }
  | {
      status: "approved";
      connection: OpenAiOAuthConnectionStatus;
    };

export interface OpenAiOAuthAuthenticatedRequestConfig {
  accessToken: string;
  accountId: string | null;
  baseUrl: string;
  headers: Record<string, string>;
  sessionId: string;
}
