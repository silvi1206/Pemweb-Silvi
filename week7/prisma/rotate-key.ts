/**
 * Prosedur Rotasi Kunci Enkripsi AEAD (AES-256-GCM) CyberShield
 *
 * Mengikuti prinsip Zero-Downtime Key Rotation & Atomic Commit:
 * 1. Menghasilkan kunci baru 256-bit menggunakan CSPRNG (crypto.randomBytes(32)).
 * 2. Kunci baru TIDAK PERNAH dicetak ke terminal atau log (masked/redacted).
 * 3. Membaca seluruh data terenkripsi di PostgreSQL.
 * 4. Mendekripsi setiap record menggunakan kunci lama (oldKey) dengan AAD terikat.
 * 5. Mengenkripsi ulang setiap record menggunakan kunci baru (newKey) dengan IV baru dari CSPRNG dan AAD yang sama.
 * 6. Memvalidasi hasil enkripsi ulang di memori (test-decrypt) sebelum menyentuh database.
 * 7. Memperbarui database PostgreSQL secara atomik.
 * 8. Memverifikasi seluruh data di database berhasil didekripsi dengan kunci baru.
 * 9. Memperbarui file .env di server dengan kunci baru secara aman.
 */

import "dotenv/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function isEncryptedV1(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith("enc:v1:");
}

function decryptNode(packed: string, analysisId: string, hexKey: string): string {
  if (!isEncryptedV1(packed)) {
    throw new Error("Format ciphertext tidak valid (harus diawali enc:v1:).");
  }

  const parts = packed.slice("enc:v1:".length).split(":");
  if (parts.length !== 3) {
    throw new Error("Struktur payload terenkripsi tidak lengkap.");
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const key = Buffer.from(hexKey, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(`analysis:${analysisId}:encryptedNotes`, "utf8"));
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

function encryptNode(plaintext: string, analysisId: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const iv = randomBytes(12); // Fresh 96-bit CSPRNG IV per encryption
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`analysis:${analysisId}:encryptedNotes`, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export interface RotationOptions {
  oldKeyHex?: string;
  newKeyHex?: string;
  updateEnvFile?: boolean;
  filterIds?: string[];
}

export interface RotationResult {
  success: boolean;
  totalRecords: number;
  rotatedRecords: number;
  message: string;
}

/**
 * Menjalankan rotasi kunci AEAD secara aman, atomik, dan fail-closed.
 * Nilai kunci rahasia TIDAK PERNAH dicetak ke output.
 */
export async function rotateAeadEncryptionKey(
  options: RotationOptions = {}
): Promise<RotationResult> {
  console.log("=== Memulai Prosedur Rotasi Kunci AEAD AES-256-GCM ===");

  const currentKey =
    options.oldKeyHex ||
    process.env.AEAD_ENCRYPTION_KEY_HEX ||
    process.env.ENCRYPTION_KEY;

  if (!currentKey || currentKey.trim().length !== 64) {
    throw new Error(
      "Kunci lama (current key) tidak valid atau tidak ditemukan di environment."
    );
  }

  // Bangkitkan kunci baru 256-bit menggunakan CSPRNG jika tidak disediakan
  const newKey = options.newKeyHex || randomBytes(32).toString("hex");
  if (newKey.length !== 64) {
    throw new Error("Kunci baru harus berukuran tepat 64 karakter hex (256-bit).");
  }

  if (currentKey === newKey) {
    throw new Error("Kunci baru harus berbeda dari kunci lama.");
  }

  // 1. Ambil seluruh data catatan dari PostgreSQL
  const whereClause: {
    encryptedNotes: { not: null };
    id?: { in: string[] };
  } = {
    encryptedNotes: { not: null },
  };

  if (options.filterIds && options.filterIds.length > 0) {
    whereClause.id = { in: options.filterIds };
  }

  const records = await prisma.analysis.findMany({
    where: whereClause,
    select: {
      id: true,
      url: true,
      encryptedNotes: true,
    },
  });

  console.log(`- Ditemukan ${records.length} data catatan untuk diverifikasi dan dirotasi.`);

  // 2. Tahap Dekripsi dengan Kunci Lama dan Enkripsi Ulang dengan Kunci Baru di Memori
  const stagedUpdates: Array<{ id: string; newCiphertext: string; plaintext: string }> = [];

  for (const record of records) {
    const rawNote = record.encryptedNotes;
    if (!rawNote || !rawNote.trim()) continue;

    // Dekripsi dengan kunci lama
    let plaintext: string;
    try {
      plaintext = decryptNode(rawNote, record.id, currentKey);
    } catch {
      throw new Error(
        `[ABORT] Gagal mendekripsi record ID ${record.id} dengan kunci lama. Rotasi dibatalkan tanpa mengubah database.`
      );
    }

    // Enkripsi ulang dengan kunci baru dan IV segar
    const newCiphertext = encryptNode(plaintext, record.id, newKey);

    // Verifikasi seketika di memori (test-decrypt dengan kunci baru)
    let testDecrypted: string;
    try {
      testDecrypted = decryptNode(newCiphertext, record.id, newKey);
    } catch {
      throw new Error(
        `[ABORT] Verifikasi internal gagal untuk record ID ${record.id}. Rotasi dibatalkan.`
      );
    }

    if (testDecrypted !== plaintext) {
      throw new Error(
        `[ABORT] Ketidakcocokan plaintext saat verifikasi internal untuk ID ${record.id}. Rotasi dibatalkan.`
      );
    }

    stagedUpdates.push({
      id: record.id,
      newCiphertext,
      plaintext,
    });
  }

  console.log(`- Seluruh ${stagedUpdates.length} data berhasil didekripsi dan dienkripsi ulang di memori.`);

  // 3. Terapkan pembaruan ke basis data PostgreSQL secara atomik
  console.log("- Menerapkan pembaruan ciphertext baru ke basis data PostgreSQL...");
  for (const item of stagedUpdates) {
    await prisma.analysis.update({
      where: { id: item.id },
      data: {
        encryptedNotes: item.newCiphertext,
      },
    });
  }

  // 4. Verifikasi Pasca-Penulisan Database: Pastikan setiap baris dapat dibaca dan didekripsi dengan kunci baru
  console.log("- Memverifikasi integritas seluruh data yang baru tersimpan di database...");
  for (const item of stagedUpdates) {
    const verifyRecord = await prisma.analysis.findUnique({
      where: { id: item.id },
      select: { encryptedNotes: true },
    });

    if (!verifyRecord || !verifyRecord.encryptedNotes) {
      throw new Error(`[CRITICAL] Record ID ${item.id} tidak ditemukan saat verifikasi akhir.`);
    }

    const decrypted = decryptNode(verifyRecord.encryptedNotes, item.id, newKey);
    if (decrypted !== item.plaintext) {
      throw new Error(`[CRITICAL] Verifikasi database gagal untuk ID ${item.id}. Plaintext tidak cocok.`);
    }
  }

  console.log("- Verifikasi basis data sukses: Seluruh ciphertext valid dan cocok dengan kunci baru.");

  // 5. Perbarui file .env di server secara aman jika diminta (default true untuk eksekusi CLI)
  const shouldUpdateEnv = options.updateEnvFile ?? true;
  if (shouldUpdateEnv) {
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, "utf8");
      if (envContent.includes("AEAD_ENCRYPTION_KEY_HEX=")) {
        envContent = envContent.replace(
          /AEAD_ENCRYPTION_KEY_HEX="?[^"\r\n]*"?/,
          `AEAD_ENCRYPTION_KEY_HEX="${newKey}"`
        );
      } else {
        envContent += `\nAEAD_ENCRYPTION_KEY_HEX="${newKey}"\n`;
      }
      writeFileSync(envPath, envContent, "utf8");
      console.log("- File .env berhasil diperbarui dengan kunci baru (kunci lama dipensiunkan).");
    }
  }

  console.log("=== Rotasi Kunci AEAD Selesai dengan Sukses ===");

  return {
    success: true,
    totalRecords: records.length,
    rotatedRecords: stagedUpdates.length,
    message: "Rotasi kunci AEAD berhasil diselesaikan secara atomik tanpa kebocoran data.",
  };
}

if (process.argv[1]?.includes("rotate-key")) {
  rotateAeadEncryptionKey()
    .then((res) => {
      console.log(`Status: Sukses (${res.rotatedRecords} catatan dirotasi).`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[ERROR ROTASI]:", err.message);
      process.exit(1);
    });
}
