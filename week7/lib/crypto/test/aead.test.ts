import { describe, expect, it } from "vitest";
import {
  encryptAesGcm,
  decryptAesGcm,
  generateAesKey,
  importAesKeyFromHex,
  exportAesKeyToHex,
} from "../aead";

describe("AEAD (AES-256-GCM) Cryptographic Tests", () => {
  it("Skenario 1: Data valid berhasil dienkripsi dan didekripsi kembali", async () => {
    const key = await generateAesKey();
    const plaintext = "Catatan rahasia hasil analisis keamanan CyberShield #12345";
    const aad = "user-id:admin-01|timestamp:2026-11-07";

    const encrypted = await encryptAesGcm(plaintext, key, aad);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex characters
    expect(encrypted.tag).toHaveLength(32); // 16 bytes = 32 hex characters

    const decrypted = await decryptAesGcm(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("Skenario 2: Ciphertext yang telah dimodifikasi (tampered) wajib ditolak", async () => {
    const key = await generateAesKey();
    const plaintext = "Risk score aman: 15";
    const encrypted = await encryptAesGcm(plaintext, key);

    // Modifikasi satu karakter pada ciphertext (misal flip bit)
    const tamperedCiphertext =
      encrypted.ciphertext.substring(0, encrypted.ciphertext.length - 2) +
      (encrypted.ciphertext.endsWith("00") ? "ff" : "00");

    const tamperedPayload = {
      ...encrypted,
      ciphertext: tamperedCiphertext,
    };

    await expect(decryptAesGcm(tamperedPayload, key)).rejects.toThrow(
      "Gagal melakukan dekripsi AEAD"
    );
  });

  it("Skenario 3: Authentication tag yang dimodifikasi wajib ditolak", async () => {
    const key = await generateAesKey();
    const plaintext = "Status: Terverifikasi oleh CyberShield";
    const encrypted = await encryptAesGcm(plaintext, key);

    // Ubah authentication tag menjadi nilai acak yang salah
    const corruptedTag = "00".repeat(16);
    const corruptedPayload = {
      ...encrypted,
      tag: corruptedTag,
    };

    await expect(decryptAesGcm(corruptedPayload, key)).rejects.toThrow(
      "Gagal melakukan dekripsi AEAD"
    );
  });

  it("Skenario 4: Kunci yang salah (wrong key) wajib ditolak", async () => {
    const originalKey = await generateAesKey();
    const wrongKey = await generateAesKey();

    const plaintext = "Informasi sensitif hanya untuk pemilik kunci asli";
    const encrypted = await encryptAesGcm(plaintext, originalKey);

    // Coba dekripsi dengan kunci yang berbeda
    await expect(decryptAesGcm(encrypted, wrongKey)).rejects.toThrow(
      "Gagal melakukan dekripsi AEAD"
    );
  });

  it("Skenario 5: AAD (Additional Authenticated Data) yang dimanipulasi wajib ditolak", async () => {
    const key = await generateAesKey();
    const plaintext = "Data rahasia dengan AAD";
    const validAad = "context:transaction-id-999";

    const encrypted = await encryptAesGcm(plaintext, key, validAad);

    // Coba dekripsi dengan AAD yang berbeda
    const tamperedAadPayload = {
      ...encrypted,
      aad: "context:transaction-id-888", // AAD palsu
    };

    await expect(decryptAesGcm(tamperedAadPayload, key)).rejects.toThrow(
      "Gagal melakukan dekripsi AEAD"
    );
  });

  it("Skenario 6: Ekspor dan impor kunci 256-bit hexadecimal berfungsi konsisten", async () => {
    const key = await generateAesKey();
    const hexKey = await exportAesKeyToHex(key);

    expect(hexKey).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars

    const importedKey = await importAesKeyFromHex(hexKey);
    const plaintext = "Uji interoperabilitas format kunci";

    const encrypted = await encryptAesGcm(plaintext, importedKey);
    const decrypted = await decryptAesGcm(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });
});
