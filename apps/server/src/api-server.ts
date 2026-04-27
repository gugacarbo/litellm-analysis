import { registerAllRoutes } from '@lite-llm/server-core/routes';
import type { RouteOptions } from '@lite-llm/server-core/types';
import express, { type Application } from 'express';

export function createApiServer(opts: RouteOptions): Application {
  const app = express();
  app.use(express.json());
  registerAllRoutes(app, opts);
  return app;
}

export default createApiServer;