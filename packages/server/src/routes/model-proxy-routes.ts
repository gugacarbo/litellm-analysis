import { Readable } from "node:stream";
import type { Application } from "express";
import {
  chatCompletionsRequestSchema,
  modelListResponseSchema,
} from "@lite-llm/model-proxy-service";
import type { RouteOptions } from "../types/index";

function readBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ? match[1].trim() : null;
}

function isAuthorized(header?: string): boolean {
  const configured = process.env.MODEL_PROXY_API_KEY?.trim();
  if (!configured) {
    return false;
  }

  return readBearerToken(header) === configured;
}

export function registerModelProxyRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.get("/v1/models", async (req, res) => {
    if (!process.env.MODEL_PROXY_API_KEY?.trim()) {
      res.status(503).json({ error: "MODEL_PROXY_API_KEY is not configured" });
      return;
    }

    if (!isAuthorized(req.header("authorization"))) {
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
    if (!process.env.MODEL_PROXY_API_KEY?.trim()) {
      res.status(503).json({ error: "MODEL_PROXY_API_KEY is not configured" });
      return;
    }

    if (!isAuthorized(req.header("authorization"))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const request = chatCompletionsRequestSchema.parse(req.body);
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
}
