import "dotenv/config";
import { describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import {
  rotateAeadEncryptionKey,
} from "../prisma/rotate-key";
import {
  encryptNote,
  decryptNote,
  importAesKeyFromHex,
  getServerAeadKey,
  isEncryptedV1,
} from "../lib/crypto/aead";
import { prisma } from "../lib/prisma";

describe("AEAD Key Rotation Security & Verification Tests", () => {
  it("AEAD-ROT-01: Prosedur rotasi kunci berhasil mengenkripsi ulang data dengan kunci baru", async () => {
    // 1. Siapkan kunci simulasi A (old key) dan kunci B (new key) menggunakan CSPRNG
    const keyAHex = randomBytes(32).toString("hex");
    const keyBHex = randomBytes(32).toString("hex");
    const keyA = await importAesKeyFromHex(keyAHex);
    const keyB = await importAesKeyFromHex(keyBHex);

    const testAnalysisId = randomUUID();
    const originalPlaintext = "Catatan sensitif rahasia sebelum proses rotasi kunci.";

    // Enkripsi dengan Kunci A
    const cipherA = await encryptNote(originalPlaintext, testAnalysisId, keyA);
    expect(isEncryptedV1(cipherA)).toBe(true);

    // Simpan ke database sementara untuk menguji rotasi riil
    await prisma.analysis.create({
      data: {
        id: testAnalysisId,
        url: "https://rot-test-" + randomBytes(4).toString("hex") + ".example.com",
        riskScore: 20,
        isSafe: true,
        recommendation: "Data uji rotasi kunci",
        sha256: "0".repeat(64),
        hmac: "0".repeat(64),
        encryptedNotes: cipherA,
      },
    });

    try {
      // 2. Jalankan rotasi dari Key A ke Key B
      const rotationResult = await rotateAeadEncryptionKey({
        oldKeyHex: keyAHex,
        newKeyHex: keyBHex,
        filterIds: [testAnalysisId],
        updateEnvFile: false, // jangan modifikasi file .env global saat unit test
      });

      expect(rotationResult.success).toBe(true);

      // 3. Ambil data terbaru dari PostgreSQL
      const updatedRecord = await prisma.analysis.findUnique({
        where: { id: testAnalysisId },
        select: { encryptedNotes: true },
      });

      expect(updatedRecord).toBeDefined();
      expect(updatedRecord?.encryptedNotes).toBeDefined();
      expect(isEncryptedV1(updatedRecord?.encryptedNotes)).toBe(true);

      // Pastikan ciphertext berubah (IV baru dan kunci baru)
      expect(updatedRecord?.encryptedNotes).not.toBe(cipherA);

      // 4. Verifikasi bahwa Kunci Baru (Key B) BERHASIL mendekripsi data
      const decryptedWithNewKey = await decryptNote(
        updatedRecord?.encryptedNotes,
        testAnalysisId,
        keyB
      );
      expect(decryptedWithNewKey).toBe(originalPlaintext);

      // 5. Verifikasi bahwa Kunci Lama (Key A) SEKARANG DITOLAK (karena data sudah dirotasi)
      await expect(
        decryptNote(updatedRecord?.encryptedNotes, testAnalysisId, keyA)
      ).rejects.toThrow(/Gagal melakukan dekripsi AEAD/);
    } finally {
      // Bersihkan data uji dari database
      await prisma.analysis.delete({ where: { id: testAnalysisId } });
    }
  });

  it("AEAD-ROT-02: Rotasi mendeteksi kegagalan dan membatalkan jika kunci lama salah", async () => {
    const invalidOldKey = randomBytes(32).toString("hex");
    const newKey = randomBytes(32).toString("hex");

    // Harus gagal dan membatalkan tanpa merusak data
    await expect(
      rotateAeadEncryptionKey({
        oldKeyHex: invalidOldKey,
        newKeyHex: newKey,
        updateEnvFile: false,
      })
    ).rejects.toThrow(/Gagal mendekripsi record/);
  });

  it("AEAD-ROT-03: Kunci aktif server di environment dapat mendekripsi seluruh baris database saat ini", async () => {
    const activeServerKey = await getServerAeadKey();
    const allRecords = await prisma.analysis.findMany({
      where: {
        encryptedNotes: { not: null },
      },
      select: {
        id: true,
        encryptedNotes: true,
      },
    });

    expect(allRecords.length).toBeGreaterThan(0);

    for (const record of allRecords) {
      expect(isEncryptedV1(record.encryptedNotes)).toBe(true);
      const decrypted = await decryptNote(record.encryptedNotes, record.id, activeServerKey);
      expect(decrypted).toBeDefined();
      expect(typeof decrypted).toBe("string");
      expect(decrypted?.length).toBeGreaterThan(0);
    }
  });
});
