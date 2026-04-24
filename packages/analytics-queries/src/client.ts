import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'litellm',
  user: process.env.DB_USER || 'llmproxy',
  password: process.env.DB_PASSWORD || 'dbpassword9090',
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

export { schema };
