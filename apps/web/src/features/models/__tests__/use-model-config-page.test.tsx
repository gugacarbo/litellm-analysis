// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useModelConfigPage } from "../use-model-config-page";

const resetFormForModel = vi.fn();
const commitSavedFormData = vi.fn();
const resetForModel = vi.fn();
const commitSavedAliases = vi.fn();

let currentModel: {
  modelName: string;
  enabled?: boolean;
  modelRoute: { modelName: string };
  config?: { displayName?: string };
} | null = null;

vi.mock("../detail/model-detail-context", () => ({
  useModelDetailContext: () => ({
    model: currentModel,
    providers: [],
  }),
}));

vi.mock("../hooks/use-model-config-form", () => ({
  useModelConfigForm: () => ({
    formData: {
      displayName: "DeepSeek Flash",
      family: "",
      ownedBy: "",
      aliases: [],
      apiMode: "",
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
    },
    initialFormData: {
      displayName: "DeepSeek Flash",
      family: "",
      ownedBy: "",
      aliases: [],
      apiMode: "",
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
    },
    isDirty: false,
    onFormDataChange: vi.fn(),
    onAddExtraParam: vi.fn(),
    onRemoveExtraParam: vi.fn(),
    onUpdateExtraParam: vi.fn(),
    resetFormForModel,
    commitSavedFormData,
  }),
}));

vi.mock("../hooks/use-model-aliases", () => ({
  useModelAliases: () => ({
    aliases: [],
    initialAliases: [],
    loaded: true,
    loading: false,
    error: null,
    isDirty: false,
    setAliases: vi.fn(),
    resetForModel,
    commitSavedAliases,
    getValidationError: vi.fn(() => null),
    normalizedAliases: [],
  }),
}));

vi.mock("../hooks/use-model-config-save", () => ({
  useModelConfigSave: () => ({
    saving: false,
    save: vi.fn(),
  }),
}));

function Harness() {
  useModelConfigPage();
  return null;
}

describe("useModelConfigPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
    currentModel = null;
  });

  it("does not reset form and aliases when the same model refetches", () => {
    currentModel = {
      modelName: "deepseek-v4-flash",
      enabled: true,
      modelRoute: {
        modelName: "deepseek-v4-flash",
      },
      config: {
        displayName: "DeepSeek Flash",
      },
    };

    const queryClient = new QueryClient();
    const view = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(resetFormForModel).toHaveBeenCalledTimes(1);
    expect(resetForModel).toHaveBeenCalledTimes(1);

    currentModel = {
      modelName: "deepseek-v4-flash",
      enabled: true,
      modelRoute: {
        modelName: "deepseek-v4-flash",
      },
      config: {
        displayName: "DeepSeek Flash Updated",
      },
    };

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Harness />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(resetFormForModel).toHaveBeenCalledTimes(1);
    expect(resetForModel).toHaveBeenCalledTimes(1);
  });
});
