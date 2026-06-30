import { describe, expect, it } from "vitest";
import { createRepositoryClient } from "./client";

describe("createRepositoryClient", () => {
  it("returns a repository instance", () => {
    const repository = createRepositoryClient();
    expect(repository).toBeDefined();
    expect(typeof repository.read).toBe("function");
  });
});
