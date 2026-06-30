import { gateway } from "@hebo-ai/gateway";
import type { IOpenAiOAuthService } from "@lite-llm/model-proxy-registry-service";
import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import { RequestLedger } from "../logging/request-ledger";
import { buildHeboGatewayConfig } from "./build-config";
import { createLedgerHooks, HEBO_MAX_BODY_SIZE } from "./ledger-hooks";

export interface HeboModelProxyGateway {
  handler: (req: Request, state?: Record<string, unknown>) => Promise<Response>;
  onRequestFinished: (listener: (requestId: string) => void) => () => void;
  refresh: () => Promise<void>;
}

export interface HeboModelProxyGatewayOptions {
  database?: PrismaClient;
  modelsService: IModelService;
  providerService: IProviderService;
  openAiOAuthService: IOpenAiOAuthService;
}

interface GatewayInstance {
  handler: (req: Request, state?: Record<string, unknown>) => Promise<Response>;
}

async function createGatewayInstance(
  options: HeboModelProxyGatewayOptions,
  ledger: RequestLedger,
): Promise<GatewayInstance> {
  const build = await buildHeboGatewayConfig({
    database: options.database,
    modelsService: options.modelsService,
    providerService: options.providerService,
  });

  const ledgerHooks = createLedgerHooks({
    build,
    database: options.database,
    ledger,
    modelsService: options.modelsService,
    providerService: options.providerService,
    openAiOAuthService: options.openAiOAuthService,
  });

  const gw = gateway({
    basePath: "/v1",
    providers: build.providers,
    models: build.models,
    hooks: {
      before: ledgerHooks.before,
      onResponse: ledgerHooks.onResponse,
      onError: ledgerHooks.onError,
      onRequest: ledgerHooks.onRequest,
      resolveProvider: ledgerHooks.resolveProvider,
    },
    advanced: {
      maxBodySize: HEBO_MAX_BODY_SIZE,
    },
  });

  return { handler: gw.handler };
}

export async function createHeboModelProxyGateway(
  options: HeboModelProxyGatewayOptions,
): Promise<HeboModelProxyGateway> {
  const database = options.database ?? getModelProxyPrisma();
  const ledger = new RequestLedger(database);
  let current = await createGatewayInstance({ ...options, database }, ledger);

  return {
    handler: (req, state) => current.handler(req, state),
    onRequestFinished: (listener) => ledger.onRequestFinished(listener),
    refresh: async () => {
      current = await createGatewayInstance({ ...options, database }, ledger);
    },
  };
}
