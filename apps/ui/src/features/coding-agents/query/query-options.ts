import { queryOptions } from "@tanstack/react-query";
import type { CodingAgentResult } from "../contracts/coding-agents";
import { getCodingAgentsOverview } from "../server/coding-agents.functions";

export const codingAgentsQueryKey = ["coding-agents", "overview"] as const;

export class CodingAgentsQueryError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "CodingAgentsQueryError";
  }
}

export async function unwrapCodingAgentResult<T>(
  request: () => Promise<CodingAgentResult<T>>,
): Promise<T> {
  const result = await request();
  if (!result.ok)
    throw new CodingAgentsQueryError(result.error.message, result.error.code);
  return result.data;
}

export const codingAgentsOverviewQuery = () =>
  queryOptions({
    queryKey: codingAgentsQueryKey,
    queryFn: () => unwrapCodingAgentResult(() => getCodingAgentsOverview()),
  });
