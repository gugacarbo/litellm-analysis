import { describe, expect, it } from "vitest";

describe("web dummy test", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("should have access to jsdom globals", () => {
    expect(document.body).toBeDefined();
  });
});
