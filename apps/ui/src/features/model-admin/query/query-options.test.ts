import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  listAliases: vi.fn(),
  listModels: vi.fn(),
  listProviders: vi.fn(),
  getModel: vi.fn(),
  getProvider: vi.fn(),
  discoverModels: vi.fn(),
}));

vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
  listApplicationSecrets: vi.fn(),
}));

import { listApplicationSecrets } from "@/features/model-admin/server/application-secrets.functions";
import {
  discoverModels,
  listModels,
} from "@/features/model-admin/server/model-admin.functions";
import {
  createModelAdminQueryClient,
  invalidateModelAdmin,
  modelAdminQueries,
  modelAdminQueryKeys,
} from "./query-options";

afterEach(() => vi.clearAllMocks());

describe("model admin query options", () => {
  it("mantem os dados em cache sem refetch automatico ao recuperar foco", () => {
    const queries = createModelAdminQueryClient().getDefaultOptions().queries;
    if (!queries) throw new Error("Query defaults are not configured");

    expect(queries.staleTime).toBe(5 * 60_000);
    expect(queries.refetchOnWindowFocus).toBe(false);
    expect(queries.refetchOnReconnect).toBe(false);
  });

  it("reutiliza o prefetch da mesma query sem uma segunda chamada", async () => {
    vi.mocked(listModels).mockResolvedValue({ ok: true, data: [] });
    const queryClient = createModelAdminQueryClient();
    const options = modelAdminQueries.models();

    await queryClient.prefetchQuery(options);
    await queryClient.fetchQuery(options);

    expect(listModels).toHaveBeenCalledTimes(1);
  });

  it("mantem cache isolado por QueryClient", async () => {
    vi.mocked(listModels).mockResolvedValue({ ok: true, data: [] });
    const first = createModelAdminQueryClient();
    const second = createModelAdminQueryClient();

    await first.fetchQuery(modelAdminQueries.models());
    await second.fetchQuery(modelAdminQueries.models());

    expect(first).not.toBe(second);
    expect(listModels).toHaveBeenCalledTimes(2);
  });

  it("invalida somente as queries afetadas de provider, modelo, alias e discovery", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateModelAdmin.provider(queryClient, "provider-a");
    await invalidateModelAdmin.model(queryClient, {
      id: "model-a",
      providerId: "provider-a",
      aliasesChanged: true,
    });
    await invalidateModelAdmin.alias(queryClient, "model-a");
    await invalidateModelAdmin.discovery(queryClient, "provider-a");

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: modelAdminQueryKeys.providers.detail("provider-a"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: modelAdminQueryKeys.models.detail("model-a"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: modelAdminQueryKeys.aliases.list,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: modelAdminQueryKeys.discovery.byProvider("provider-a"),
    });
  });

  it("usa a chave do provider na discovery", async () => {
    vi.mocked(discoverModels).mockResolvedValue({
      ok: true,
      data: { models: [] },
    });

    await createModelAdminQueryClient().fetchQuery(
      modelAdminQueries.discovery("provider-a"),
    );

    expect(discoverModels).toHaveBeenCalledWith({
      data: { providerId: "provider-a" },
    });
  });

  it("consulta e invalida o status de segredos separadamente", async () => {
    vi.mocked(listApplicationSecrets).mockResolvedValue({ ok: true, data: [] });
    const queryClient = createModelAdminQueryClient();

    await queryClient.fetchQuery(modelAdminQueries.applicationSecrets());
    await invalidateModelAdmin.applicationSecrets(queryClient);

    expect(listApplicationSecrets).toHaveBeenCalledWith({ data: {} });
    expect(
      queryClient.getQueryState(modelAdminQueryKeys.applicationSecrets.list)
        ?.isInvalidated,
    ).toBe(true);
  });
});
