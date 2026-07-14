/**
 * Server-only configuration boundary for the provider destination policy.
 * The service owns DNS validation and transport; this prevents UI input from
 * ever influencing the allowlist passed to that service.
 */
export function readProviderDestinationAllowlist(
  value = process.env.PROVIDER_DESTINATION_ALLOWLIST,
): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ];
}
