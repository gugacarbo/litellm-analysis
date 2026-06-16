import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import type { IModelService } from "@lite-llm/models-service";
import type {
  ChatCompletionsRequest,
  ModelListResponse,
} from "./schemas";

export interface ModelProxyServiceOptions {
  database?: PrismaClient;
  fetchFn?: typeof fetch;
  modelsService: IModelService;
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

export interface IModelProxyService {
  listModels(): Promise<ModelListResponse>;
  createChatCompletion(
    request: ChatCompletionsRequest,
    signal?: AbortSignal,
  ): Promise<ProxyResponse>;
  createStreamingChatCompletion(
    request: ChatCompletionsRequest,
    signal?: AbortSignal,
  ): Promise<StreamingProxyResponse>;
}
