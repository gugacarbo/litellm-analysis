import { describe, expect, it } from "vitest";
import {
  escapeRegExp,
  generateAliasCleanupPattern,
} from "../../src/utils/regex";

describe("escapeRegExp", () => {
  it("should escape special regex characters", () => {
    expect(escapeRegExp("test.value")).toBe("test\\.value");
    expect(escapeRegExp("test*")).toBe("test\\*");
    expect(escapeRegExp("test+")).toBe("test\\+");
    expect(escapeRegExp("test?")).toBe("test\\?");
    expect(escapeRegExp("test(1)")).toBe("test\\(1\\)");
  });

  it("should handle regular strings unchanged", () => {
    expect(escapeRegExp("simple")).toBe("simple");
    expect(escapeRegExp("abc123")).toBe("abc123");
  });

  it("should escape brackets", () => {
    expect(escapeRegExp("test[1]")).toBe("test\\[1\\]");
    expect(escapeRegExp("test{1}")).toBe("test\\{1\\}");
  });

  it("should escape backslash and pipes", () => {
    expect(escapeRegExp("test\\path")).toBe("test\\\\path");
    expect(escapeRegExp("a|b")).toBe("a\\|b");
  });
});

describe("generateAliasCleanupPattern", () => {
  it("should generate pattern for key", () => {
    const pattern = generateAliasCleanupPattern("sisyphus");
    expect(pattern.test("sisyphus/")).toBe(true);
    expect(pattern.test("sisyphus/gpt-5.5")).toBe(true);
    expect(pattern.test("sisyphus/gpt-5.4")).toBe(true);
  });

  it("should not match different key prefix", () => {
    const pattern = generateAliasCleanupPattern("sisyphus");
    expect(pattern.test("oracle/gpt-5.5")).toBe(false);
    expect(pattern.test("sisyphusjunior/gpt-5.5")).toBe(false);
  });

  it("should handle special characters in key", () => {
    const pattern = generateAliasCleanupPattern("visual-engineering");
    expect(pattern.test("visual-engineering/")).toBe(true);
    expect(pattern.test("visual-engineering/gpt-5.5")).toBe(true);
  });
});
