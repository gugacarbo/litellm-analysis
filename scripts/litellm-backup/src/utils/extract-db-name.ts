export function extractDbName(databaseUrl: string): string {
  const match = databaseUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : "unknown";
}
