import { describe, expect, it, vi } from "vitest";

vi.mock("@lite-llm/agents-repository/db-repository", () => ({
  createDbRepository: vi.fn(() => ({ read: vi.fn() })),
}));

import { createRepositoryClient } from "./client";

describe("createRepositoryClient", () => {
  it("returns a repository instance", () => {
    const repository = createRepositoryClient();
    expect(repository).toBeDefined();
    expect(typeof repository.read).toBe("function");
  });
});
