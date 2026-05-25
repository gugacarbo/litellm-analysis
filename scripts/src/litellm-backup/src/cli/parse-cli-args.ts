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
      fast: { type: "boolean", default: false },
      "no-gzip": { type: "boolean", default: false },
      parallel: { type: "string", short: "p", default: "1" },
      jobs: { type: "string", short: "j", default: "1" },
      "compress-level": { type: "string", short: "z", default: "0" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  return {
    retention: parseInt(values.retention as string, 10),
    outputDir: values["output-dir"] as string,
    fast: values.fast as boolean,
    noGzip: values["no-gzip"] as boolean,
    parallel: parseInt(values.parallel as string, 10),
    jobs: parseInt(values.jobs as string, 10),
    compressLevel: parseInt(values["compress-level"] as string, 10),
    help: values.help as boolean,
  };
}
