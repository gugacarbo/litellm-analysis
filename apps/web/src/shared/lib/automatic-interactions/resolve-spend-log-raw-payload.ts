import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import { extractSpendLogMessages } from "./extract-spend-log-messages";

const MESSAGE_REF_PATTERN = /^messages\[(\d+)\]$/;

export function resolveSpendLogRawPayload(
  log: ProxyRequestLog,
  ref: string,
): unknown {
  const match = MESSAGE_REF_PATTERN.exec(ref);
  if (!match) return undefined;

  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 0) return undefined;

  const messages = extractSpendLogMessages(log);
  return messages[index];
}
