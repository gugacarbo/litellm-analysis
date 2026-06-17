import { describe, expect, it } from "vitest";
import { sanitizeHeboRequestBody } from "./sanitize-request-body";

describe("sanitizeHeboRequestBody", () => {
  it("hoists MiniMax reasoning_split out of extra_body", () => {
    expect(
      sanitizeHeboRequestBody({
        model: "MiniMax-M2.7-highspeed",
        extra_body: { reasoning_split: true },
      }),
    ).toEqual({
      model: "MiniMax-M2.7-highspeed",
      reasoning_split: true,
    });
  });

  it("keeps nested provider records in extra_body", () => {
    expect(
      sanitizeHeboRequestBody({
        extra_body: {
          google: { cached_content: "abc" },
          reasoning_split: true,
        },
      }),
    ).toEqual({
      reasoning_split: true,
      extra_body: {
        google: { cached_content: "abc" },
      },
    });
  });

  it("does not override an existing top-level field", () => {
    expect(
      sanitizeHeboRequestBody({
        reasoning_split: false,
        extra_body: { reasoning_split: true },
      }),
    ).toEqual({
      reasoning_split: false,
    });
  });

  it("converts chat-style responses input items", () => {
    expect(
      sanitizeHeboRequestBody(
        {
          model: "minimax-m3",
          input: [
            { role: "system", content: "You are helpful" },
            { role: "user", content: "Say ok" },
          ],
        },
        { path: "/v1/responses" },
      ),
    ).toEqual({
      model: "minimax-m3",
      input: [
        { type: "message", role: "system", content: "You are helpful" },
        { type: "message", role: "user", content: "Say ok" },
      ],
    });
  });

  it("maps messages to input for responses requests", () => {
    expect(
      sanitizeHeboRequestBody(
        {
          model: "minimax-m3",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 32,
        },
        { path: "/v1/responses" },
      ),
    ).toEqual({
      model: "minimax-m3",
      input: [{ type: "message", role: "user", content: "hi" }],
      max_output_tokens: 32,
    });
  });

  it("converts parts-based responses input items", () => {
    expect(
      sanitizeHeboRequestBody(
        {
          model: "minimax-m3",
          input: [
            {
              id: "connection-test-1:system",
              role: "system",
              parts: [{ type: "text", text: "hello" }],
            },
            {
              id: "connection-test-1:user",
              role: "user",
              parts: [{ type: "text", text: "hi" }],
            },
          ],
        },
        { path: "/v1/responses" },
      ),
    ).toEqual({
      model: "minimax-m3",
      input: [
        {
          id: "connection-test-1:system",
          type: "message",
          role: "system",
          content: "hello",
        },
        {
          id: "connection-test-1:user",
          type: "message",
          role: "user",
          content: "hi",
        },
      ],
    });
  });

  it("does not rewrite messages for chat completions", () => {
    expect(
      sanitizeHeboRequestBody(
        {
          model: "minimax-m3",
          messages: [{ role: "user", content: "hi" }],
        },
        { path: "/v1/chat/completions" },
      ),
    ).toEqual({
      model: "minimax-m3",
      messages: [{ role: "user", content: "hi" }],
    });
  });
});
