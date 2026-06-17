import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { serverEnv } from "@lite-llm/config/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

type ChatRequestBody = {
  messages?: UIMessage[];
  config?: {
    modelName?: string;
  };
};

const DEFAULT_MODEL_PROXY_BASE_URL = "http://localhost:3008/v1";

function getModelProxyBaseUrl(): string {
  return serverEnv.MODEL_PROXY_BASE_URL?.trim() || DEFAULT_MODEL_PROXY_BASE_URL;
}

export function registerChatRoutes(
  app: Application,
  _opts: RouteOptions,
): void {
  app.post("/chat", async (req, res) => {
    try {
      const body = req.body as ChatRequestBody;
      const modelName = body.config?.modelName?.trim();

      if (!modelName) {
        res.status(400).json({ error: "config.modelName is required" });
        return;
      }

      const apiKey =
        process.env.MODEL_PROXY_API_KEY?.trim() ??
        serverEnv.MODEL_PROXY_API_KEY?.trim();
      if (!apiKey) {
        res.status(503).json({
          error: "MODEL_PROXY_API_KEY is not configured",
        });
        return;
      }

      const proxy = createOpenAICompatible({
        name: "model-proxy",
        baseURL: getModelProxyBaseUrl(),
        apiKey,
      });

      const messages = body.messages ?? [];
      const result = streamText({
        model: proxy(modelName),
        messages: await convertToModelMessages(messages),
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: String(error) });
      }
    }
  });
}
