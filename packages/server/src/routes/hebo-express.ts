import type { IncomingMessage, ServerResponse } from "node:http";
import type { HeboModelProxyGateway } from "@lite-llm/llm-gateway/hebo";
import { sanitizeHeboRequestBody } from "@lite-llm/llm-gateway/hebo/sanitize-request-body";
import { createRequest, sendResponse } from "@mjackson/node-fetch-server";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function toSanitizedRequest(
  req: IncomingMessage,
  res: ServerResponse,
  signal: AbortSignal,
): Promise<Request> {
  const request = createRequest(req, res);

  if (!METHODS_WITH_BODY.has(request.method.toUpperCase())) {
    return new Request(request, { signal });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Request(request, { signal });
  }

  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return new Request(request, { signal });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return new Request(request, {
      body: rawBody,
      signal,
    });
  }

  const requestPath = new URL(request.url, "http://localhost").pathname;
  const sanitized = sanitizeHeboRequestBody(parsed, { path: requestPath });
  const headers = new Headers(request.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify(sanitized),
    signal,
  });
}

export async function handleHeboGatewayExpressRequest(
  req: IncomingMessage,
  res: ServerResponse,
  gatewayHandler: HeboModelProxyGateway["handler"],
): Promise<void> {
  const abortController = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  const signal = AbortSignal.any(
    [abortController.signal].filter(
      (value): value is AbortSignal => value !== undefined,
    ),
  );
  const forwardedRequest = await toSanitizedRequest(req, res, signal);
  const response = await gatewayHandler(forwardedRequest);
  await sendResponse(res, response);
}
