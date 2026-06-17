import { describe, expect, it } from "vitest";
import {
  extractLedgerMessages,
  extractModelName,
  injectUpstreamModel,
  isStreamingRequest,
} from "./proxy-payload";

describe("proxy-payload", () => {
  it("extracts model name without validating other fields", () => {
    expect(
      extractModelName({
        model: "gpt-test",
        messages: [{ role: "user", content: "hi" }],
        tools: [{ type: "function", function: { name: "x" } }],
      }),
    ).toBe("gpt-test");
  });

  it("injects upstream model while preserving the rest of the payload", () => {
    const body = {
      model: "local-alias",
      stream: true,
      messages: [{ role: "user", content: "hi" }],
      custom_field: { nested: true },
    };

    expect(injectUpstreamModel(body, "upstream-model")).toEqual({
      model: "upstream-model",
      stream: true,
      messages: [{ role: "user", content: "hi" }],
      custom_field: { nested: true },
    });
  });

  it("detects streaming requests", () => {
    expect(isStreamingRequest({ model: "x", stream: true })).toBe(true);
    expect(isStreamingRequest({ model: "x", stream: false })).toBe(false);
  });

  it("extracts ledger messages from chat and responses payloads", () => {
    expect(
      extractLedgerMessages({
        messages: [{ role: "user", content: "hello" }],
      }),
    ).toEqual([{ role: "user", content: "hello" }]);

    expect(
      extractLedgerMessages({
        input: "hello",
      }),
    ).toEqual([{ role: "user", content: "hello" }]);
  });
});
