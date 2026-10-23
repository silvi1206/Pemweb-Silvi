import { describe, expect, it } from "vitest";
import {
  createHmac,
  generateHmacKey,
  verifyHmac,
} from "../hmac";

describe("HMAC-SHA-256", () => {
  it("menghasilkan HMAC dengan panjang 64 karakter", async () => {
    const key = await generateHmacKey();
    const result = await createHmac(
      "CyberShield analysis result",
      key
    );

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("memverifikasi data yang tidak berubah", async () => {
    const key = await generateHmacKey();
    const data = "Risk score: 85";

    const hmac = await createHmac(data, key);
    const valid = await verifyHmac(data, hmac, key);

    expect(valid).toBe(true);
  });

  it("menolak data yang sudah dimanipulasi", async () => {
    const key = await generateHmacKey();

    const original = "Risk score: 85";
    const manipulated = "Risk score: 10";

    const hmac = await createHmac(original, key);
    const valid = await verifyHmac(manipulated, hmac, key);

    expect(valid).toBe(false);
  });

  it("menolak HMAC yang salah", async () => {
    const key = await generateHmacKey();
    const data = "Risk score: 85";

    const valid = await verifyHmac(
      data,
      "0000000000000000000000000000000000000000000000000000000000000000",
      key
    );

    expect(valid).toBe(false);
  });
});