import type { SpendLog } from "@lite-llm/contracts/analytics";
import { extractSpendLogMessages } from "./extract-spend-log-messages";

const MESSAGE_REF_PATTERN = /^messages\[(\d+)\]$/;

export function resolveSpendLogRawPayload(log: SpendLog, ref: string): unknown {
  const match = MESSAGE_REF_PATTERN.exec(ref);
  if (!match) return undefined;

  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 0) return undefined;

  const messages = extractSpendLogMessages(log);
  return messages[index];
}
