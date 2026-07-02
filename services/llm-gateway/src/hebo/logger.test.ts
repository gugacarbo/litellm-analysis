import { describe, expect, it } from "vitest";
import { isExpectedAbortWarningLog } from "./logger";

describe("isExpectedAbortWarningLog", () => {
  it("filters abort errors logged inside a record payload", () => {
    expect(
      isExpectedAbortWarningLog([
        {
          requestId: "req_123",
          err: new DOMException("The operation was aborted.", "AbortError"),
        },
      ]),
    ).toBe(true);
  });

  it("filters direct abort errors", () => {
    expect(
      isExpectedAbortWarningLog([
        new DOMException("The operation was aborted.", "AbortError"),
      ]),
    ).toBe(true);
  });

  it("keeps non-abort warnings visible", () => {
    expect(
      isExpectedAbortWarningLog([
        {
          requestId: "req_123",
          err: new Error("upstream failed"),
        },
      ]),
    ).toBe(false);
  });
});
