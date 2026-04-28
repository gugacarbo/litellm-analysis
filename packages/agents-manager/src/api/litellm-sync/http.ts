// ── LiteLLM HTTP Operations ──

import { isLikelyAlreadyExistsError, isLikelyNotFoundError } from "./errors.js";
import type { LiteLLMUpsertPayload } from "./payload.js";

async function postModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  endpoint: "/model/new" | "/model/update",
  payload: LiteLLMUpsertPayload,
): Promise<Response> {
  const trimmedBaseUrl = baseUrl.replace(/\/$/, "");
  const urls = [`${trimmedBaseUrl}${endpoint}`];
  if (trimmedBaseUrl.endsWith("/v1")) {
    urls.push(`${trimmedBaseUrl.slice(0, -3)}${endpoint}`);
  }

  let lastResponse: Response | null = null;
  for (const url of urls) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== 404) {
      return response;
    }
    lastResponse = response;
  }

  return lastResponse as Response;
}

export async function upsertModelToLiteLLM(
  baseUrl: string,
  apiKey: string,
  payload: LiteLLMUpsertPayload,
): Promise<void> {
  const updateResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/update",
    payload,
  );
  if (updateResponse.ok) {
    return;
  }

  const updateErrorText = await updateResponse
    .text()
    .catch(() => "Unknown error");
  if (!isLikelyNotFoundError(updateResponse.status, updateErrorText)) {
    throw new Error(
      `Failed to update model "${payload.model_name}": ${updateResponse.status} ${updateErrorText}`,
    );
  }

  const createResponse = await postModelToLiteLLM(
    baseUrl,
    apiKey,
    "/model/new",
    payload,
  );
  if (createResponse.ok) {
    return;
  }

  const createErrorText = await createResponse
    .text()
    .catch(() => "Unknown error");
  if (isLikelyAlreadyExistsError(createResponse.status, createErrorText)) {
    const retryUpdateResponse = await postModelToLiteLLM(
      baseUrl,
      apiKey,
      "/model/update",
      payload,
    );
    if (retryUpdateResponse.ok) {
      return;
    }

    const retryUpdateErrorText = await retryUpdateResponse
      .text()
      .catch(() => "Unknown error");
    throw new Error(
      `Failed to update model "${payload.model_name}" after create conflict: ${retryUpdateResponse.status} ${retryUpdateErrorText}`,
    );
  }

  throw new Error(
    `Failed to create model "${payload.model_name}": ${createResponse.status} ${createErrorText}`,
  );
}
