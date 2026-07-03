const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, options: { status: number; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? null;
  }
}

export function withDays(endpoint: string, days?: number): string {
  if (days === undefined) {
    return endpoint;
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}days=${days}`;
}

export type DateRangeParams = {
  startDate?: string;
  endDate?: string;
};

export function withDateRange(
  endpoint: string,
  dateRange?: DateRangeParams,
): string {
  if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
    return endpoint;
  }
  const params = new URLSearchParams();
  if (dateRange.startDate) {
    params.set("startDate", dateRange.startDate);
  }
  if (dateRange.endDate) {
    params.set("endDate", dateRange.endDate);
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}${params.toString()}`;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;
      if (payload?.error) {
        message = payload.error;
      }
      throw new ApiError(message, {
        status: response.status,
        code: payload?.code,
      });
    } else {
      const text = await response.text().catch(() => "");
      if (text.trim()) {
        message = text.trim();
      }
    }

    throw new ApiError(message, { status: response.status });
  }

  return response.json();
}
