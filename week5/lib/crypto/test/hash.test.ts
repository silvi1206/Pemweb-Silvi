import { describe, expect, it } from "vitest";
import { sha256 } from "../../../lib/crypto/hash";

describe("SHA-256 URL fingerprint", () => {
  it("menghasilkan hash SHA-256 dengan panjang 64 karakter", async () => {
    const result = await sha256("https://example.com");

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("menghasilkan hash yang sama untuk input yang sama", async () => {
    const url = "https://example.com";

    const first = await sha256(url);
    const second = await sha256(url);

    expect(first).toBe(second);
  });

  it("menghasilkan hash berbeda ketika URL berubah", async () => {
    const first = await sha256("https://example.com");
    const second = await sha256("https://example.org");

    expect(first).not.toBe(second);
  });

  it("tetap dapat memproses input kosong", async () => {
    const result = await sha256("");

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});