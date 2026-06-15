import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/components/assistant-ui/markdown-text", () => ({
  MarkdownText: () => null,
}));
vi.mock("@/shared/components/assistant-ui/shiki-highlighter", () => ({
  ShikiHighlighter: () => null,
}));

import { Thread } from "@/shared/components/assistant-ui/thread";

describe("assistant-ui Thread smoke", () => {
  it("exports Thread component", () => {
    expect(Thread).toBeDefined();
    expect(typeof Thread).toBe("function");
  });
});
