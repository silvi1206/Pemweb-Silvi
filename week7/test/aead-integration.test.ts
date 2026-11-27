import "dotenv/config";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import {
  encryptNote,
  decryptNote,
  isEncryptedV1,
  packEncryptedPayload,
  unpackEncryptedPayload,
  generateAesKey,
  importAesKeyFromHex,
} from "../lib/crypto/aead";
import {
  createAnalysisAction,
  getAnalysisByIdAction,
  updateAnalysisAction,
  deleteAnalysisAction,
} from "../app/actions/analysis";
import { prisma } from "../lib/prisma";
import { createDatabaseSession, _setTestSessionCookie } from "../lib/auth/session";
import { hashPassword } from "../lib/auth/password";

describe("AEAD AES-256-GCM Integration & Database Persistence Tests", () => {
  const dummyAnalysisId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const dummyPlaintext = "Catatan rahasia hasil investigasi phishing URL perbankan.";
  let aeadAdminUserId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.create({
      data: {
        name: "AEAD Admin Tester",
        email: `aead.admin.${Date.now()}@cybershield.test`,
        passwordHash: await hashPassword("AdminAeadPass#2026"),
        role: "admin",
      },
    });
    aeadAdminUserId = adminUser.id;

    const { rawToken } = await createDatabaseSession(aeadAdminUserId);
    _setTestSessionCookie(rawToken);
  });

  afterAll(async () => {
    _setTestSessionCookie(null);
    if (aeadAdminUserId) {
      await prisma.session.deleteMany({ where: { userId: aeadAdminUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: aeadAdminUserId } }).catch(() => {});
    }
  });

  // 1. Enkripsi dan dekripsi berhasil
  it("AEAD-INT-01: Enkripsi dan dekripsi berhasil mengembalikan plaintext asli", async () => {
    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId);
    expect(encrypted).toBeDefined();
    expect(isEncryptedV1(encrypted)).toBe(true);

    const decrypted = await decryptNote(encrypted, dummyAnalysisId);
    expect(decrypted).toBe(dummyPlaintext);
  });

  // 2. Ciphertext berbeda total dari plaintext
  it("AEAD-INT-02: Ciphertext berformat 'enc:v1:' dan tidak mengandung plaintext mentah", async () => {
    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId);
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    expect(encrypted).not.toContain(dummyPlaintext);
  });

  // 3. Setiap enkripsi menghasilkan IV/nonce baru dari CSPRNG
  it("AEAD-INT-03: Setiap pemanggilan enkripsi menghasilkan IV/nonce baru unik (CSPRNG)", async () => {
    const enc1 = await encryptNote(dummyPlaintext, dummyAnalysisId);
    const enc2 = await encryptNote(dummyPlaintext, dummyAnalysisId);

    const payload1 = unpackEncryptedPayload(enc1);
    const payload2 = unpackEncryptedPayload(enc2);

    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.ciphertext).not.toBe(payload2.ciphertext);
  });

  // 4. Data ciphertext yang dimodifikasi ditolak (fail-closed)
  it("AEAD-INT-04: Ciphertext yang dimanipulasi ditolak saat dekripsi (fail-closed)", async () => {
    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId);
    const payload = unpackEncryptedPayload(encrypted);

    // Ubah 1 karakter pada ciphertext
    const tamperedHex =
      payload.ciphertext.slice(0, -2) +
      (payload.ciphertext.slice(-2) === "00" ? "ff" : "00");

    const tamperedPacked = packEncryptedPayload({
      ...payload,
      ciphertext: tamperedHex,
    });

    await expect(decryptNote(tamperedPacked, dummyAnalysisId)).rejects.toThrow(
      /Gagal melakukan dekripsi AEAD/
    );
  });

  // 5. Authentication tag yang dimodifikasi ditolak
  it("AEAD-INT-05: Tag autentikasi yang dimanipulasi ditolak saat dekripsi", async () => {
    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId);
    const payload = unpackEncryptedPayload(encrypted);

    // Ubah 1 karakter pada tag
    const tamperedTag =
      payload.tag.slice(0, -2) +
      (payload.tag.slice(-2) === "11" ? "22" : "11");

    const tamperedPacked = packEncryptedPayload({
      ...payload,
      tag: tamperedTag,
    });

    await expect(decryptNote(tamperedPacked, dummyAnalysisId)).rejects.toThrow(
      /Gagal melakukan dekripsi AEAD/
    );
  });

  // 6. Kunci enkripsi yang salah ditolak
  it("AEAD-INT-06: Dekripsi menggunakan kunci berbeda ditolak secara aman", async () => {
    const correctKey = await generateAesKey();
    const wrongKey = await generateAesKey();

    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId, correctKey);

    await expect(decryptNote(encrypted, dummyAnalysisId, wrongKey)).rejects.toThrow(
      /Gagal melakukan dekripsi AEAD/
    );
  });

  // 7. AAD yang salah ditolak (context binding to analysisId)
  it("AEAD-INT-07: AAD yang tidak cocok (analysisId berbeda) ditolak", async () => {
    const encrypted = await encryptNote(dummyPlaintext, dummyAnalysisId);
    const differentAnalysisId = "99999999-8888-7777-6666-555544443333";

    await expect(decryptNote(encrypted, differentAnalysisId)).rejects.toThrow(
      /Gagal melakukan dekripsi AEAD/
    );
  });

  // 8. Kunci tidak tersedia atau format salah menyebabkan kegagalan
  it("AEAD-INT-08: Format kunci dengan panjang bukan 64 karakter ditolak", async () => {
    await expect(importAesKeyFromHex("pendek123")).rejects.toThrow(
      /Kunci AES-256 harus berukuran tepat 64 karakter hexadecimal/
    );
  });

  // 9. Data lama yang belum dimigrasikan tidak dibaca sebagai plaintext secara diam-diam
  it("AEAD-INT-09: Data lama/plaintext tidak dibaca secara diam-diam dan ditolak", async () => {
    const legacyPlaintext = "Catatan lama yang belum dienkripsi";

    await expect(decryptNote(legacyPlaintext, dummyAnalysisId)).rejects.toThrow(
      /Data catatan tidak berada dalam format terenkripsi \(enc:v1\)/
    );
  });

  // 10. Data pada PostgreSQL benar-benar berupa ciphertext saat disimpan via Server Action
  it("AEAD-INT-10: Server Action menyimpan catatan sebagai ciphertext 'enc:v1:' di PostgreSQL", async () => {
    const sensitiveNote = "Kredensial dan catatan investigator rahasia internal.";
    const createResult = await createAnalysisAction({
      url: "https://secure-crypto-vault-audit.example.com",
      riskScore: 40,
      isSafe: true,
      recommendation: "Analisis simulasi pengujian kriptografi database.",
      sha256: "1".repeat(64),
      hmac: "2".repeat(64),
      encryptedNotes: sensitiveNote,
    });

    expect(createResult.success).toBe(true);
    const createdId = (createResult.data as { id: string }).id;

    // QUERY LANGSUNG KE POSTGRESQL MENGGUNAKAN PRISMA (Memeriksa kolom mentah di DB)
    const rawDbRecord = await prisma.analysis.findUnique({
      where: { id: createdId },
      select: {
        id: true,
        encryptedNotes: true,
      },
    });

    expect(rawDbRecord).toBeDefined();
    expect(rawDbRecord?.encryptedNotes).toBeDefined();
    // Bukti nyata: kolom di database adalah ciphertext berawalan enc:v1:
    expect(rawDbRecord?.encryptedNotes?.startsWith("enc:v1:")).toBe(true);
    // Bukti nyata: plaintext asli tidak pernah tersimpan di database
    expect(rawDbRecord?.encryptedNotes).not.toContain(sensitiveNote);

    // 11. Server Action membaca dan mendekripsi data untuk UI tanpa membocorkan kunci
    const getResult = await getAnalysisByIdAction(createdId);
    expect(getResult.success).toBe(true);
    const retrievedData = getResult.data as { encryptedNotes: string };
    expect(retrievedData.encryptedNotes).toBe(sensitiveNote);

    // 12. Server Action Update memperbarui ciphertext dengan IV baru di PostgreSQL
    const updatedNote = "Catatan rahasia setelah pembaruan review.";
    const updateResult = await updateAnalysisAction(createdId, {
      recommendation: "Rekomendasi diupdate",
      encryptedNotes: updatedNote,
    });
    expect(updateResult.success).toBe(true);

    const rawUpdatedDb = await prisma.analysis.findUnique({
      where: { id: createdId },
      select: { encryptedNotes: true },
    });
    expect(rawUpdatedDb?.encryptedNotes?.startsWith("enc:v1:")).toBe(true);
    expect(rawUpdatedDb?.encryptedNotes).not.toBe(rawDbRecord?.encryptedNotes);

    // Bersihkan data pengujian
    await deleteAnalysisAction(createdId);
  });
});
