/**
 * Model routing helpers — canonical import path for Batch 3 registry code.
 * Legacy `litellmParams` builders remain in `lite-llm-params.ts`.
 */
export {
  fromModelProxyRow,
  fromModelRoute,
  type ModelProxyRowWrite,
  type ModelRoute,
  type ModelRouteUpdate,
  toModelProxyRow,
  toModelRoute,
} from "@lite-llm/model-proxy-registry-service";

function normalizeCredentialName(
  credentialName?: string | null,
): string | undefined {
  if (typeof credentialName !== "string") {
    return undefined;
  }

  const normalized = credentialName.trim();
  return normalized ? normalized : undefined;
}

export function getCredentialNameFromParams(
  params: Record<string, unknown>,
): string | undefined {
  return normalizeCredentialName(
    params.litellm_credential_name as string | undefined,
  );
}

export function resolveModelCredential(
  litellmParams: Record<string, unknown>,
  fallbackCredential?: string | null,
): string | undefined {
  return (
    getCredentialNameFromParams(litellmParams) ??
    normalizeCredentialName(fallbackCredential)
  );
}
