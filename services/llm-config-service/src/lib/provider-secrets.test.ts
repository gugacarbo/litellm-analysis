import { describe, expect, it } from "vitest";
import {
  encryptProviderSecret,
  resolveProviderCredential,
} from "./provider-secrets.js";

describe("provider credential envelope", () => {
  const key = Buffer.from("a".repeat(32));

  it("round-trips only a valid encrypted envelope", () => {
    const envelope = encryptProviderSecret("test-secret-value", key);
    expect(envelope).not.toContain("test-secret-value");
    expect(
      resolveProviderCredential({ credentialEnvelope: envelope }, key),
    ).toBe("test-secret-value");
  });

  it("fails closed for plaintext and malformed envelopes", () => {
    expect(() =>
      resolveProviderCredential(
        { credentialEnvelope: "test-secret-value" },
        key,
      ),
    ).toThrow("Stored provider credential cannot be decrypted");
    expect(() =>
      resolveProviderCredential({ credentialEnvelope: "enc:v1:not-json" }, key),
    ).toThrow("Stored provider credential cannot be decrypted");
    expect(() =>
      resolveProviderCredential({ credentialEnvelope: null }, key),
    ).toThrow("Stored provider credential cannot be decrypted");
  });
});
