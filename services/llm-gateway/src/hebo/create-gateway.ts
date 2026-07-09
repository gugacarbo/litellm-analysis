import { gateway } from "@hebo-ai/gateway";
import type { IOpenAiOAuthService } from "@lite-llm/llm-config-service";
import type { IProviderService } from "@lite-llm/models-service";
import { RequestLedger } from "../logging/request-ledger";
import { buildHeboGatewayConfig } from "./build-config";
import { createLedgerHooks, HEBO_MAX_BODY_SIZE } from "./ledger-hooks";
import { createHeboLogger } from "./logger";

export interface HeboModelProxyGateway {
  handler: (req: Request, state?: Record<string, unknown>) => Promise<Response>;
  onRequestFinished: (listener: (requestId: string) => void) => () => void;
  refresh: () => Promise<void>;
}

interface HeboModelProxyGatewayOptions {
  providerService: IProviderService;
  openAiOAuthService: IOpenAiOAuthService;
}

interface GatewayInstance {
  handler: (req: Request, state?: Record<string, unknown>) => Promise<Response>;
}

function createGatewayUnavailableResponse(): Response {
  return Response.json(
    {
      error: {
        message:
          "No upstream providers are configured for the model proxy yet.",
        type: "service_unavailable",
      },
    },
    { status: 503 },
  );
}

async function createGatewayInstance(
  options: HeboModelProxyGatewayOptions,
  ledger: RequestLedger,
): Promise<GatewayInstance> {
  const build = await buildHeboGatewayConfig({
    providerService: options.providerService,
  });

  const ledgerHooks = createLedgerHooks({
    build,
    ledger,
    providerService: options.providerService,
    openAiOAuthService: options.openAiOAuthService,
  });

  if (Object.keys(build.providers).length === 0) {
    console.warn(
      "[hebo] No upstream providers configured; returning 503 for /v1 requests until a provider is added.",
    );
    return {
      handler: async () => createGatewayUnavailableResponse(),
    };
  }

  const gw = gateway({
    basePath: "/v1",
    logger: createHeboLogger(),
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
  const ledger = new RequestLedger();
  let current = await createGatewayInstance(options, ledger);

  return {
    handler: (req, state) => current.handler(req, state),
    onRequestFinished: (listener) => ledger.onRequestFinished(listener),
    refresh: async () => {
      current = await createGatewayInstance(options, ledger);
    },
  };
}
