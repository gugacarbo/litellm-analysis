const API_BASE = '/api';

export type ApiError = {
  error: string;
};

export type ApiResponse<T> = T | ApiError;

export class FeatureUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureUnavailableError';
  }
}

export function isFeatureUnavailable(error: unknown): boolean {
  return (
    error instanceof FeatureUnavailableError ||
    (error instanceof Error && error.message.includes('not available in'))
  );
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 501) {
    const errorData = (await response.json()) as ApiError;
    throw new FeatureUnavailableError(errorData.error);
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
