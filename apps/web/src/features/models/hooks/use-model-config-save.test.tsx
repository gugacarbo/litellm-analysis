import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useModelConfigSave } from "./use-model-config-save";
import type { ModelConfigFormData } from "./use-model-config-form";
import type { UseModelAliasesResult } from "./use-model-aliases";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";

const {
  updateModelMock,
  updateModelAliasesMock,
  toastErrorMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  updateModelMock: vi.fn(async () => ({ success: true })),
  updateModelAliasesMock: vi.fn(async () => undefined),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("@/shared/lib/api-client/models", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/shared/lib/api-client/models")>();
  return {
    ...actual,
    updateModel: updateModelMock,
  };
});

vi.mock("@/shared/lib/api-client/model-aliases", () => ({
  updateModelAliases: updateModelAliasesMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

let latestSave: (() => Promise<void>) | null = null;

function createFormData(
  overrides: Partial<ModelConfigFormData> = {},
): ModelConfigFormData {
  return {
    displayName: "Pretty GPT",
    family: "gpt",
    ownedBy: "openai",
    aliases: [],
    apiMode: "openai",
    vision: false,
    enabled: true,
    thinkingLevels: [],
    reasoning: {
      enabled: false,
      effort: "",
      apiMode: "",
      enableThinking: false,
      includeReasoningInRequest: false,
    },
    apiBase: "",
    providerName: "",
    inputCostPerToken: "",
    outputCostPerToken: "",
    extraParams: {},
    ...overrides,
  };
}

function createAliasesState(): UseModelAliasesResult {
  return {
    aliases: [],
    initialAliases: [],
    loaded: true,
    loading: false,
    error: null,
    isDirty: false,
    setAliases: vi.fn(),
    resetForModel: vi.fn(),
    commitSavedAliases: vi.fn(),
    getValidationError: vi.fn(() => null),
    normalizedAliases: [],
  };
}

function Harness({
  model,
  formData,
  aliasesState,
  queryClient,
}: {
  model: ModelWithStatus;
  formData: ModelConfigFormData;
  aliasesState: UseModelAliasesResult;
  queryClient: QueryClient;
}) {
  const { save } = useModelConfigSave({
    model,
    formData,
    aliasesState,
    queryClient,
    onSaved: () => undefined,
  });

  useEffect(() => {
    latestSave = save;
  }, [save]);

  return null;
}

describe("useModelConfigSave", () => {
  beforeEach(() => {
    latestSave = null;
    updateModelMock.mockClear();
    updateModelAliasesMock.mockClear();
    toastErrorMock.mockClear();
    toastSuccessMock.mockClear();
  });

  it("sends displayName inside config when saving model settings", async () => {
    const queryClient = new QueryClient();
    const model: ModelWithStatus = {
      modelName: "gpt-4.1",
      modelRoute: {
        modelName: "gpt-4.1",
      },
      status: "synced",
      config: {
        displayName: "Old Name",
      },
    };

    render(
      <QueryClientProvider client={queryClient}>
        <Harness
          model={model}
          formData={createFormData()}
          aliasesState={createAliasesState()}
          queryClient={queryClient}
        />
      </QueryClientProvider>,
    );

    expect(latestSave).not.toBeNull();

    await act(async () => {
      await latestSave?.();
    });

    expect(updateModelMock).toHaveBeenCalledWith(
      "gpt-4.1",
      expect.any(Object),
      undefined,
      expect.objectContaining({
        displayName: "Pretty GPT",
      }),
    );
  });
});
