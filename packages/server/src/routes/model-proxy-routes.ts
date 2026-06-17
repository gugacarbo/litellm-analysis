import type { Application, Request, Response } from "express";
import type { RouteOptions } from "../types/index";
import { handleHeboGatewayExpressRequest } from "./hebo-express";

interface ProxyAuthResult {
  authorized: boolean;
  apiKeyAlias?: string;
}

function readBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ? match[1].trim() : null;
}

async function authorizeRequest(
  header: string | undefined,
  opts: RouteOptions,
): Promise<ProxyAuthResult> {
  const token = readBearerToken(header);
  if (!token) {
    return { authorized: false };
  }

  const verifyResult = await opts.registry.apiKeysService.verify(token);
  if (verifyResult.valid) {
    return {
      authorized: true,
      apiKeyAlias: verifyResult.record?.label ?? "unknown-key",
    };
  }

  const configured = process.env.MODEL_PROXY_API_KEY?.trim();
  if (configured && token === configured) {
    return { authorized: true, apiKeyAlias: "MODEL_PROXY_API_KEY" };
  }

  return { authorized: false };
}

async function hasConfiguredAuth(opts: RouteOptions): Promise<boolean> {
  if (process.env.MODEL_PROXY_API_KEY?.trim()) {
    return true;
  }

  const keys = await opts.registry.apiKeysService.list();
  return keys.some((key) => key.enabled);
}

function isV1ProxyPath(path: string): boolean {
  return (
    path === "/models" ||
    path === "/chat/completions" ||
    path === "/responses" ||
    path === "/embeddings" ||
    path.startsWith("/conversations") ||
    path === "/messages"
  );
}

async function forwardToHeboGateway(
  req: Request,
  res: Response,
  opts: RouteOptions,
  state: Record<string, unknown>,
): Promise<void> {
  try {
    await handleHeboGatewayExpressRequest(req, res, (request, requestState) =>
      opts.heboGateway.handler(request, {
        ...requestState,
        ...state,
      }),
    );
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(error) });
    }
  }
}

export function registerModelProxyRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.use("/v1", (req, res) => {
    if (!isV1ProxyPath(req.path)) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    void (async () => {
      if (!(await hasConfiguredAuth(opts))) {
        res.status(503).json({
          error:
            "No model proxy API keys configured (set MODEL_PROXY_API_KEY or seed model_proxy_api_keys)",
        });
        return;
      }

      const auth = await authorizeRequest(req.header("authorization"), opts);
      if (!auth.authorized) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await forwardToHeboGateway(req, res, opts, {
        apiKeyAlias: auth.apiKeyAlias,
      });
    })();
  });
}
