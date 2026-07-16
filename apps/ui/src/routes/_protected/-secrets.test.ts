import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
  listApplicationSecrets: vi.fn(),
  removeApplicationSecret: vi.fn(),
  replaceApplicationSecret: vi.fn(),
  testApplicationSecret: vi.fn(),
}));

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  listProviders: vi.fn(),
  testProvider: vi.fn(),
  updateProvider: vi.fn(),
}));

import { listApplicationSecrets } from "@/features/model-admin/server/application-secrets.functions";
import { listProviders } from "@/features/model-admin/server/model-admin.functions";
import { Route } from "./secrets";

afterEach(() => vi.clearAllMocks());

describe("/secrets route", () => {
  it("preloads application secrets and provider credentials", async () => {
    vi.mocked(listApplicationSecrets).mockResolvedValue({ ok: true, data: [] });
    vi.mocked(listProviders).mockResolvedValue({ ok: true, data: [] });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const loader = Route.options.loader;
    if (typeof loader !== "function") {
      throw new Error("The secrets loader is not configured");
    }

    await loader({ context: { queryClient } } as never);

    expect(listApplicationSecrets).toHaveBeenCalledWith({ data: {} });
    expect(listProviders).toHaveBeenCalledWith({ data: {} });
  });
});
