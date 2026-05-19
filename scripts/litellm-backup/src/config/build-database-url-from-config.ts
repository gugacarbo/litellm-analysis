import { serverEnv } from "../../../../packages/config/src/server";

export function buildDatabaseUrlFromConfig(): string {
  const user = encodeURIComponent(serverEnv.DB_USER);
  const password = encodeURIComponent(serverEnv.DB_PASSWORD);
  const host = serverEnv.DB_HOST;
  const port = serverEnv.DB_PORT;
  const dbName = encodeURIComponent(serverEnv.DB_NAME);

  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
}
