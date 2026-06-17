/** Derive env var name from legacy `credential_name` (batch-3-legacy-import §2). */
export function deriveSecretRefFromCredentialName(
  credentialName: string,
): string {
  const normalized = credentialName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    return "CREDENTIAL_API_KEY";
  }

  if (normalized.endsWith("_API_KEY")) {
    return normalized;
  }

  return `${normalized}_API_KEY`;
}
