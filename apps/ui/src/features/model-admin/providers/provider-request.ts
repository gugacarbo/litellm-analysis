import type { Result } from "@/features/model-admin/contracts/model-admin";

type PublicError = {
  code: string;
  message: string;
  retryable: boolean;
  dependentModelCount?: number;
};

export class ProviderRequestError extends Error {
  readonly details: PublicError;

  constructor(details: PublicError) {
    super(details.message);
    this.name = "ProviderRequestError";
    this.details = details;
  }
}

export async function unwrapProviderResult<T>(
  request: Promise<Result<T>>,
): Promise<T> {
  const result = await request;
  if (!result.ok) throw new ProviderRequestError(result.error);
  return result.data;
}

export function toProviderErrorMessage(error: unknown): string {
  if (error instanceof ProviderRequestError) {
    if (error.details.dependentModelCount !== undefined) {
      return `Há ${error.details.dependentModelCount} modelo(s) dependente(s). Remova ou mova-os antes de excluir este provider.`;
    }
    return error.details.retryable
      ? `${error.message} Você pode tentar novamente.`
      : error.message;
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}
