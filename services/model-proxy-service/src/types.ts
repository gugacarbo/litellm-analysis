import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import type {
  ChatCompletionsRequest,
  ModelListResponse,
  ResponsesRequest,
} from "./schemas";

export interface ModelProxyServiceOptions {
  database?: PrismaClient;
  fetchFn?: typeof fetch;
  modelsService: IModelService;
  providerService: IProviderService;
  now?: () => Date;
}

export interface ProxyResponse {
  headers: Headers;
  payload: unknown;
  status: number;
}

export interface StreamingProxyResponse {
  body: ReadableStream<Uint8Array>;
  headers: Headers;
  status: number;
}

export interface ProxyRequestContext {
  apiKeyAlias?: string | null;
}

export type ProxyEndpointResult =
  | { kind: "json"; response: ProxyResponse }
  | { kind: "stream"; response: StreamingProxyResponse };

export interface IModelProxyService {
  listModels(): Promise<ModelListResponse>;
  proxyOpenAiEndpoint(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal,
    context?: ProxyRequestContext,
  ): Promise<ProxyEndpointResult>;
  createChatCompletion(
    request: ChatCompletionsRequest | unknown,
    signal?: AbortSignal,
    context?: ProxyRequestContext,
  ): Promise<ProxyResponse>;
  createStreamingChatCompletion(
    request: ChatCompletionsRequest | unknown,
    signal?: AbortSignal,
    context?: ProxyRequestContext,
  ): Promise<StreamingProxyResponse>;
  createResponse(
    request: ResponsesRequest | unknown,
    signal?: AbortSignal,
    context?: ProxyRequestContext,
  ): Promise<ProxyResponse>;
  createStreamingResponse(
    request: ResponsesRequest | unknown,
    signal?: AbortSignal,
    context?: ProxyRequestContext,
  ): Promise<StreamingProxyResponse>;
  onRequestFinished(listener: (requestId: string) => void): () => void;
}
