import { Chalk } from "chalk";

export type LogMetadata = Record<string, unknown>;

export type Logger = {
  debug: (event: string, meta?: LogMetadata) => void;
  info: (event: string, meta?: LogMetadata) => void;
  warn: (event: string, meta?: LogMetadata) => void;
  error: (event: string, meta?: LogMetadata) => void;
};

type LogLevel = keyof Logger;

const chalk = new Chalk();

function formatMetadata(metadata: LogMetadata): string {
  return Object.entries(metadata)
    .map(
      ([key, value]) =>
        `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`,
    )
    .join(" ");
}

function formatPretty(
  level: LogLevel,
  event: string,
  consumer: string,
  timestamp: string,
  metadata: LogMetadata,
): string {
  const levelText = level.toUpperCase().padEnd(5);
  const colorLevel = {
    debug: chalk.blue,
    info: chalk.green,
    warn: chalk.yellow,
    error: chalk.red,
  }[level](levelText);
  const metadataText = formatMetadata(metadata);
  return [
    chalk.gray(timestamp),
    colorLevel,
    chalk.cyan(`[${consumer}]`),
    chalk.bold(event),
    metadataText,
  ]
    .filter(Boolean)
    .join("  ");
}

export function createLogger({ consumer }: { consumer: string }): Logger {
  const write = (
    level: LogLevel,
    event: string,
    metadata: LogMetadata = {},
  ): void => {
    const timestamp = new Date().toISOString();
    const format = process.env.LOGGER_FORMAT === "pretty" ? "pretty" : "json";
    const output =
      format === "pretty"
        ? formatPretty(level, event, consumer, timestamp, metadata)
        : JSON.stringify({ ...metadata, level, event, consumer, timestamp });

    console[level](output);
  };

  return {
    debug: (event, metadata) => write("debug", event, metadata),
    info: (event, metadata) => write("info", event, metadata),
    warn: (event, metadata) => write("warn", event, metadata),
    error: (event, metadata) => write("error", event, metadata),
  };
}
