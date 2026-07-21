type CatalogSource = {
  modelId: string;
  providerName: string;
  isDefault: boolean;
};

export function buildHeboCatalogKeys(
  rows: readonly CatalogSource[],
): Map<CatalogSource, string[]> {
  const byModel = new Map<string, CatalogSource[]>();
  for (const row of rows) {
    const group = byModel.get(row.modelId) ?? [];
    group.push(row);
    byModel.set(row.modelId, group);
  }

  const result = new Map<CatalogSource, string[]>();
  for (const row of rows) {
    const peers = byModel.get(row.modelId) ?? [row];
    if (peers.length === 1) {
      result.set(row, [row.modelId]);
      continue;
    }

    const keys = [`${row.providerName}/${row.modelId}`];
    const defaults = peers.filter((peer) => peer.isDefault);
    if (defaults.length === 1 && defaults[0] === row) keys.push(row.modelId);
    result.set(row, keys);
  }
  return result;
}

export function toEnvironmentVariable(providerName: string): string {
  const normalized = providerName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return `${normalized || "PROVIDER"}_API_KEY`;
}

export function toOpenCodeProviderId(providerName: string): string {
  const normalized = providerName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized || "provider";
}
