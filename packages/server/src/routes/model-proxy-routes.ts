import { Readable } from "node:stream";
import {
  chatCompletionsRequestSchema,
  modelListResponseSchema,
} from "@lite-llm/model-proxy-service";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

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

async function isAuthorized(
  header: string | undefined,
  opts: RouteOptions,
): Promise<boolean> {
  return (await authorizeRequest(header, opts)).authorized;
}

async function hasConfiguredAuth(opts: RouteOptions): Promise<boolean> {
  if (process.env.MODEL_PROXY_API_KEY?.trim()) {
    return true;
  }

  const keys = await opts.registry.apiKeysService.list();
  return keys.some((key) => key.enabled);
}

export function registerModelProxyRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.get("/v1/models", async (req, res) => {
    if (!(await hasConfiguredAuth(opts))) {
      res.status(503).json({
        error:
          "No model proxy API keys configured (set MODEL_PROXY_API_KEY or seed model_proxy_api_keys)",
      });
      return;
    }

    if (!(await isAuthorized(req.header("authorization"), opts))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const response = await opts.modelProxyService.listModels();
      res.json(modelListResponseSchema.parse(response));
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ZodError"
      ) {
        res.status(500).json({ error: "Invalid model proxy response shape" });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/v1/chat/completions", async (req, res) => {
    if (!(await hasConfiguredAuth(opts))) {
      res.status(503).json({
        error:
          "No model proxy API keys configured (set MODEL_PROXY_API_KEY or seed model_proxy_api_keys)",
      });
      return;
    }

    if (!(await isAuthorized(req.header("authorization"), opts))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const request = chatCompletionsRequestSchema.parse(req.body);
      const auth = await authorizeRequest(req.header("authorization"), opts);
      if (request.stream) {
        const abortController = new AbortController();
        res.on("close", () => {
          if (!res.writableEnded) {
            abortController.abort();
          }
        });

        const response =
          await opts.modelProxyService.createStreamingChatCompletion(
            request,
            abortController.signal,
            { apiKeyAlias: auth.apiKeyAlias },
          );

        res.status(response.status);
        response.headers.forEach((value, key) => {
          if (key.toLowerCase() === "content-length") {
            return;
          }
          res.setHeader(key, value);
        });

        const body = Readable.fromWeb(response.body as never);
        body.on("error", (error) => {
          if (!res.headersSent) {
            res.status(500).json({ error: String(error) });
            return;
          }
          res.end();
        });
        body.pipe(res);
        return;
      }

      const response = await opts.modelProxyService.createChatCompletion(
        request,
        undefined,
        { apiKeyAlias: auth.apiKeyAlias },
      );
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "content-length") {
          return;
        }
        res.setHeader(key, value);
      });
      res.json(response.payload);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ZodError"
      ) {
        const message =
          "message" in error ? String(error.message) : "Invalid request";
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/v1/responses", async (req, res) => {
    if (!(await hasConfiguredAuth(opts))) {
      res.status(503).json({
        error:
          "No model proxy API keys configured (set MODEL_PROXY_API_KEY or seed model_proxy_api_keys)",
      });
      return;
    }

    if (!(await isAuthorized(req.header("authorization"), opts))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(501).json({
      error: {
        message:
          "The OpenAI Responses API is not implemented by the local model proxy yet. Use POST /v1/chat/completions instead.",
        type: "not_implemented",
        code: "responses_api_not_supported",
      },
    });
  });
}
