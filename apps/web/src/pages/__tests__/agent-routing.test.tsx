import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";

vi.mock("../../lib/api-client", () => ({
  getAgentRoutingConfig: vi.fn(),
  getAgentConfig: vi.fn(),
  getAgentDefinitions: vi.fn(),
  updateAgentRoutingConfig: vi.fn(),
  updateAgentConfig: vi.fn(),
  getAllModels: vi.fn(),
  getGlobalFallbackModel: vi.fn(),
}));

import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from "@lite-llm/api-contracts/agent-routing";
import {
  getAgentConfig,
  getAgentDefinitions,
  getAgentRoutingConfig,
  getAllModels,
  getGlobalFallbackModel,
} from "../../lib/api-client";
import { AgentRoutingPage } from "../agent-routing";

describe("AgentRoutingPage", () => {
  const mockRoutingConfig = {
    sisyphus: "qwen3.5-plus",
    oracle: "kimi-k2.5",
  };

  const mockModels = [
    {
      modelName: "qwen3.5-plus",
      litellmParams: { api_base: "https://api.openai.com" },
    },
    {
      modelName: "gpt-3.5-turbo",
      litellmParams: { api_base: "https://api.openai.com" },
    },
    {
      modelName: "kimi-k2.5",
      litellmParams: { api_base: "https://api.anthropic.com" },
    },
    {
      modelName: "glm-5",
      litellmParams: { api_base: "https://api.anthropic.com" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAgentDefinitions).mockResolvedValue({
      agents: AGENT_DEFINITIONS,
      categories: CATEGORY_DEFINITIONS,
    });
    vi.mocked(getAgentConfig).mockResolvedValue({ agents: {}, categories: {} });
    vi.mocked(getGlobalFallbackModel).mockResolvedValue({
      globalFallbackModel: "gpt-5.1",
    });
    vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);
  });

  describe("Renderização", () => {
    it("deve renderizar a página com título", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
    });

    it("deve mostrar todos os agentes", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByText("Sisyphus")).toBeInTheDocument();
        expect(screen.getByText("Oracle")).toBeInTheDocument();
        expect(screen.getByText("Prometheus")).toBeInTheDocument();
        expect(screen.getByText("Metis")).toBeInTheDocument();
      });
    });

    it("deve mostrar modelos atribuídos corretamente", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {
          sisyphus: { model: "qwen3.5-plus" },
          oracle: { model: "kimi-k2.5" },
        },
        categories: {},
      });
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getAllByText("qwen3.5-plus").length).toBeGreaterThan(0);
        expect(screen.getAllByText("kimi-k2.5").length).toBeGreaterThan(0);
      });
    });

    it("deve renderizar aba de categorias", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Categories" }),
        ).toBeInTheDocument();
      });
    });

    it("deve mostrar Model Stations colapsável", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByText("Model Stations")).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText("Model Stations"));
      await waitFor(() => {
        expect(screen.getByText("No models configured")).toBeInTheDocument();
      });
    });
  });

  describe("Interação", () => {
    it("deve abrir dialog ao clicar em editar", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByText("Sisyphus")).toBeInTheDocument();
      });
      // Find edit button by palette icon inside agent card and click
      const paletteButtons = document.querySelectorAll(
        'button[title="Edit configuration"]',
      );
      expect(paletteButtons.length).toBeGreaterThan(0);
      await userEvent.click(paletteButtons[0]);
      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });
    });

    it("deve fechar dialog ao clicar em Cancel", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByText("Sisyphus")).toBeInTheDocument();
      });
      const paletteButtons = document.querySelectorAll(
        'button[title="Edit configuration"]',
      );
      expect(paletteButtons.length).toBeGreaterThan(0);
      await userEvent.click(paletteButtons[0]);
      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await userEvent.click(cancelButton);
      await waitFor(() => {
        expect(
          screen.queryByText(/Edit Agent Configuration:/),
        ).not.toBeInTheDocument();
      });
    });

    it("deve mostrar category edit dialog", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Categories" }),
        ).toBeInTheDocument();
      });
      await userEvent.click(screen.getByRole("tab", { name: "Categories" }));
      await waitFor(() => {
        expect(screen.getByText("Visual Engineering")).toBeInTheDocument();
      });
    });
  });

  describe("Layout", () => {
    it("deve exibir abas de agentes e categorias", async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      renderWithQueryClient(<AgentRoutingPage />);
      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Agents" })).toBeInTheDocument();
        expect(
          screen.getByRole("tab", { name: "Categories" }),
        ).toBeInTheDocument();
      });
    });
  });
});
