// ── LiteLLM Error Detection ──

export function isLikelyAlreadyExistsError(
  status: number,
  errorText: string,
): boolean {
  if (status === 409) {
    return true;
  }
  if (status !== 400) {
    return false;
  }
  return /already exists|already registered|duplicate|exists/i.test(errorText);
}

export function isLikelyNotFoundError(
  status: number,
  errorText: string,
): boolean {
  if (status === 404) {
    return true;
  }
  if (status !== 400) {
    return false;
  }
  return /not found|no row|does not exist|missing/i.test(errorText);
}
