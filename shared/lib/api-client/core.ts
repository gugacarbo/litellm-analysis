const API_BASE = "/api";

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
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
