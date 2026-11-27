/**
 * Skrip Migrasi & Backfill Catatan Terenkripsi (AEAD AES-256-GCM) CyberShield
 * Mengonversi seluruh data `encryptedNotes` plaintext warisan (legacy)
 * ke format terenkripsi berversi `enc:v1:<ivHex>:<tagHex>:<ciphertextHex>`
 * dengan autentikasi AAD terikat pada ID record.
 *
 * Bersifat aman dan idempoten: Tidak memodifikasi data yang sudah terenkripsi.
 */

import "dotenv/config";
import { createCipheriv, randomBytes } from "node:crypto";
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

function encryptNoteNode(plaintext: string, analysisId: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const iv = randomBytes(12); // 96-bit CSPRNG IV
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const aad = Buffer.from(`analysis:${analysisId}:encryptedNotes`, "utf8");
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes (128 bits)
  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export async function backfillEncryptedNotes(): Promise<{
  total: number;
  migrated: number;
  alreadyEncrypted: number;
}> {
  console.log("=== Memulai Pemeriksaan dan Backfill Catatan Terenkripsi ===");

  const hexKey =
    process.env.AEAD_ENCRYPTION_KEY_HEX || process.env.ENCRYPTION_KEY;

  if (!hexKey || hexKey.trim().length !== 64) {
    throw new Error(
      "AEAD_ENCRYPTION_KEY_HEX tidak dikonfigurasi dengan benar (wajib 64 karakter hex / 256-bit di .env). Backfill dihentikan demi keamanan."
    );
  }

  const records = await prisma.analysis.findMany({
    where: {
      encryptedNotes: {
        not: null,
      },
    },
    select: {
      id: true,
      url: true,
      encryptedNotes: true,
    },
  });

  let migratedCount = 0;
  let alreadyEncryptedCount = 0;

  for (const record of records) {
    const rawNote = record.encryptedNotes;
    if (!rawNote || !rawNote.trim()) continue;

    if (isEncryptedV1(rawNote)) {
      alreadyEncryptedCount++;
      continue;
    }

    // Terdeteksi data warisan berupa teks terbuka (plaintext)
    console.log(`- Mengenkripsi data warisan plaintext untuk URL: ${record.url} (ID: ${record.id})`);
    const cipherText = encryptNoteNode(rawNote.trim(), record.id, hexKey);

    await prisma.analysis.update({
      where: { id: record.id },
      data: {
        encryptedNotes: cipherText,
      },
    });

    migratedCount++;
  }

  console.log(
    `=== Selesai: Total Diperiksa: ${records.length}, Berhasil Dienkripsi: ${migratedCount}, Sudah Terenkripsi: ${alreadyEncryptedCount} ===`
  );

  return {
    total: records.length,
    migrated: migratedCount,
    alreadyEncrypted: alreadyEncryptedCount,
  };
}

// Tambahkan skrip npm run jika dipanggil secara mandiri
if (process.argv[1]?.includes("backfill-notes")) {
  backfillEncryptedNotes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Gagal menjalankan backfill catatan:", err);
      process.exit(1);
    });
}
