import { describe, expect, it } from "vitest";
import { redactHeaders, redactPayload } from "./payload-redactor";

describe("payload-redactor", () => {
  it("removes sensitive headers", () => {
    const headers = new Headers({
      authorization: "Bearer sk-secret-key-12345678",
      "x-api-key": "sk-another-key-12345678",
      "content-type": "application/json",
    });

    expect(redactHeaders(headers)).toEqual({
      "content-type": "application/json",
    });
  });

  it("redacts API keys and bearer tokens in payloads", () => {
    const payload = {
      model: "gpt-4",
      messages: [{ role: "user", content: "use sk-abcdefghijklmnopqrst" }],
      api_key: "sk-should-be-redacted-123456",
      authorization: "Bearer sk-token-12345678",
    };

    expect(redactPayload(payload)).toEqual({
      model: "gpt-4",
      messages: [{ role: "user", content: "use [REDACTED]" }],
      api_key: "[REDACTED]",
      authorization: "[REDACTED]",
    });
  });

  it("redacts bearer tokens in string payloads", () => {
    const raw = "Authorization: Bearer sk-live-1234567890abcdef";
    expect(redactPayload(raw)).toBe("Authorization: Bearer [REDACTED]");
  });
});
