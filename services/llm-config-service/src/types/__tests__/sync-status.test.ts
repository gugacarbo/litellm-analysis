import { describe, expect, it } from "vitest";
import {
  normalizeSyncDirection,
  normalizeSyncPresenceStatus,
} from "../sync-status.js";

describe("sync-status", () => {
  it("accepts current sync presence labels", () => {
    expect(normalizeSyncPresenceStatus("synced")).toBe("synced");
    expect(normalizeSyncPresenceStatus("config-only")).toBe("config-only");
    expect(normalizeSyncPresenceStatus("registry-only")).toBe("registry-only");
  });

  it("rejects legacy sync presence labels", () => {
    expect(() => normalizeSyncPresenceStatus("litellm-only")).toThrow(
      /Unsupported model sync presence status/,
    );
  });

  it("accepts current sync directions", () => {
    expect(normalizeSyncDirection("config-to-registry")).toBe(
      "config-to-registry",
    );
    expect(normalizeSyncDirection("registry-to-config")).toBe(
      "registry-to-config",
    );
  });

  it("rejects legacy sync directions", () => {
    expect(() => normalizeSyncDirection("config-to-litellm")).toThrow(
      /Unsupported model sync direction/,
    );
    expect(() => normalizeSyncDirection("litellm-to-config")).toThrow(
      /Unsupported model sync direction/,
    );
  });
});
