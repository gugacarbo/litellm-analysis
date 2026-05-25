export function createTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[:-]/g, "")
    .replace("T", "_")
    .slice(0, 15);
}
