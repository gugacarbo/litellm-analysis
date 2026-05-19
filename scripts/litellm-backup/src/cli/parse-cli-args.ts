import path from "node:path";
import { parseArgs } from "node:util";

import type { CliOptions } from "../types/backup";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../../..");

export function parseCliArgs(): CliOptions {
  const { values } = parseArgs({
    options: {
      retention: { type: "string", short: "r", default: "7" },
      "output-dir": {
        type: "string",
        short: "o",
        default: path.join(PROJECT_ROOT, ".backups", "lite-llm"),
      },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  return {
    retention: parseInt(values.retention as string, 10),
    outputDir: values["output-dir"] as string,
    help: values.help as boolean,
  };
}
