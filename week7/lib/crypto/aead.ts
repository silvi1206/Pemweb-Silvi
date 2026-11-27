/**
 * Modul Kriptografi AEAD (Authenticated Encryption with Associated Data)
 * Menggunakan standar industri AES-256-GCM melalui Web Crypto API.
 *
 * Menyediakan kerahasiaan (confidentiality), integritas (integrity),
 * dan otentisitas data (authenticity).
 */

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0) {
    throw new Error("Format hexadecimal tidak valid (panjang ganjil).");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(byte)) {
      throw new Error("Karakter hexadecimal tidak valid.");
    }
    bytes[i / 2] = byte;
  }
  return bytes;
};

export interface EncryptedPayload {
  iv: string; // 12-byte (96-bit) IV dalam format hex
  ciphertext: string; // ciphertext dalam format hex
  tag: string; // 16-byte (128-bit) GCM authentication tag dalam format hex
  aad?: string; // Additional Authenticated Data (opsional)
}

/**
 * Menghasilkan kunci simetris 256-bit AES-GCM menggunakan CSPRNG.
 */
export async function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Mengimpor kunci dari string hexadecimal 64-karakter (256-bit) ke CryptoKey.
 */
export async function importAesKeyFromHex(hexKey: string): Promise<CryptoKey> {
  const trimmed = hexKey.trim();
  if (trimmed.length !== 64) {
    throw new Error(
      "Kunci AES-256 harus berukuran tepat 64 karakter hexadecimal (256-bit)."
    );
  }
  const rawBytes = hexToBytes(trimmed);
  return crypto.subtle.importKey(
    "raw",
    rawBytes as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Mengekspor CryptoKey ke representasi hexadecimal untuk kebutuhan key management aman.
 */
export async function exportAesKeyToHex(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return bytesToHex(new Uint8Array(exported));
}

/**
 * Mengenkripsi plaintext menggunakan AES-256-GCM (AEAD).
 * Setiap pemanggilan menghasilkan IV unik 96-bit (12-byte) dari CSPRNG.
 */
export async function encryptAesGcm(
  plaintext: string,
  key: CryptoKey,
  aad?: string
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Kebijakan keunikan IV: Selalu gunakan 12 bytes CSPRNG unik per enkripsi.
  // Tidak pernah menggunakan ulang (reuse) IV dengan kunci yang sama.
  const ivBytes = new Uint8Array(12);
  crypto.getRandomValues(ivBytes);

  const algorithmParams: AesGcmParams = {
    name: "AES-GCM",
    iv: ivBytes,
    tagLength: 128, // 128-bit authentication tag
  };

  if (aad) {
    algorithmParams.additionalData = encoder.encode(aad);
  }

  // Web Crypto API menggabungkan ciphertext dan 16-byte tag di akhir buffer
  const encryptedBuffer = await crypto.subtle.encrypt(
    algorithmParams,
    key,
    data
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  // Pisahkan ciphertext dan tag
  const tagLengthBytes = 16;
  const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - tagLengthBytes);
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - tagLengthBytes);

  return {
    iv: bytesToHex(ivBytes),
    ciphertext: bytesToHex(ciphertextBytes),
    tag: bytesToHex(tagBytes),
    aad,
  };
}

/**
 * Mendekripsi payload AES-256-GCM.
 * Menjamin integritas dan kerahasiaan: Gagal secara tertutup jika ciphertext,
 * IV, tag, AAD, atau kunci dimanipulasi sekecil apa pun.
 */
export async function decryptAesGcm(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const ivBytes = hexToBytes(payload.iv);
  const ciphertextBytes = hexToBytes(payload.ciphertext);
  const tagBytes = hexToBytes(payload.tag);

  // Rekonstruksi buffer gabungan (ciphertext + tag) yang diharapkan Web Crypto
  const combinedBytes = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combinedBytes.set(ciphertextBytes, 0);
  combinedBytes.set(tagBytes, ciphertextBytes.length);

  const algorithmParams: AesGcmParams = {
    name: "AES-GCM",
    iv: ivBytes as unknown as BufferSource,
    tagLength: 128,
  };

  if (payload.aad) {
    algorithmParams.additionalData = encoder.encode(payload.aad) as unknown as BufferSource;
  }

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      algorithmParams,
      key,
      combinedBytes as unknown as BufferSource
    );
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    // Fail-closed: Tolak dekripsi jika autentikasi tag / data gagal
    throw new Error(
      "Gagal melakukan dekripsi AEAD: Integritas data tidak valid atau kunci salah."
    );
  }
}

/**
 * Prefix format penyimpanan terenkripsi berversi CyberShield (v1).
 * Format spesifikasi: `enc:v1:<ivHex>:<tagHex>:<ciphertextHex>`
 */
export const ENCRYPTED_PREFIX_V1 = "enc:v1:";

/**
 * Memeriksa apakah suatu string tersimpan dalam format terenkripsi berversi v1.
 */
export function isEncryptedV1(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith(ENCRYPTED_PREFIX_V1);
}

/**
 * Mengemas EncryptedPayload ke dalam format penyimpanan berversi string:
 * `enc:v1:<ivHex>:<tagHex>:<ciphertextHex>`
 */
export function packEncryptedPayload(payload: EncryptedPayload): string {
  return `${ENCRYPTED_PREFIX_V1}${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}

/**
 * Membongkar format penyimpanan berversi `enc:v1:<iv>:<tag>:<ciphertext>` ke EncryptedPayload.
 * Melempar error jika data bukan format berversi valid atau merupakan legacy plaintext.
 */
export function unpackEncryptedPayload(
  packed: string,
  aad?: string
): EncryptedPayload {
  if (!isEncryptedV1(packed)) {
    throw new Error(
      "Format ciphertext tidak valid atau merupakan data plaintext yang belum dimigrasikan."
    );
  }

  const parts = packed.slice(ENCRYPTED_PREFIX_V1.length).split(":");
  if (parts.length !== 3) {
    throw new Error("Struktur payload terenkripsi tidak lengkap.");
  }

  const [iv, tag, ciphertext] = parts;
  if (iv.length !== 24) {
    throw new Error("Panjang IV tidak valid (harus tepat 24 karakter hex / 96-bit).");
  }
  if (tag.length !== 32) {
    throw new Error("Panjang tag tidak valid (harus tepat 32 karakter hex / 128-bit).");
  }
  if (!ciphertext || ciphertext.length % 2 !== 0) {
    throw new Error("Format ciphertext hexadecimal tidak valid.");
  }

  return { iv, tag, ciphertext, aad };
}

/**
 * Memuat kunci AES-256-GCM server dari environment variable `AEAD_ENCRYPTION_KEY_HEX`
 * (atau fallback `ENCRYPTION_KEY`).
 * Validasi ketat format dan ukuran kunci 256-bit (64 karakter hexadecimal).
 */
export async function getServerAeadKey(): Promise<CryptoKey> {
  const envKey =
    process.env.AEAD_ENCRYPTION_KEY_HEX || process.env.ENCRYPTION_KEY;

  if (!envKey || !envKey.trim()) {
    throw new Error(
      "Kunci enkripsi AEAD server tidak ditemukan di environment (AEAD_ENCRYPTION_KEY_HEX)."
    );
  }

  const trimmed = envKey.trim();
  if (trimmed.length !== 64) {
    throw new Error(
      "Format kunci AEAD_ENCRYPTION_KEY_HEX harus tepat 64 karakter hexadecimal (256-bit)."
    );
  }

  return importAesKeyFromHex(trimmed);
}

/**
 * Mengenkripsi catatan khusus (encryptedNotes) sebelum disimpan ke PostgreSQL.
 * AAD terikat secara deterministik ke konteks entitas: `analysis:${analysisId}:encryptedNotes`
 * Menjamin nonce/IV baru dari CSPRNG untuk setiap kali enkripsi.
 */
export async function encryptNote(
  plaintext: string,
  analysisId: string,
  overrideKey?: CryptoKey
): Promise<string> {
  if (!plaintext || typeof plaintext !== "string") {
    throw new Error("Plaintext catatan harus berupa teks non-kosong.");
  }
  if (!analysisId || typeof analysisId !== "string") {
    throw new Error("ID Analysis wajib disertakan untuk pengikatan konteks AAD.");
  }

  const key = overrideKey ?? (await getServerAeadKey());
  const aad = `analysis:${analysisId}:encryptedNotes`;
  const payload = await encryptAesGcm(plaintext, key, aad);
  return packEncryptedPayload(payload);
}

/**
 * Mendekripsi catatan khusus (encryptedNotes) yang dibaca dari database PostgreSQL di server.
 * Mengembalikan null jika storedValue null atau kosong.
 * Menolak data yang bukan berformat `enc:v1:` atau gagal verifikasi tag/AAD/key (fail-closed).
 */
export async function decryptNote(
  storedValue: string | null | undefined,
  analysisId: string,
  overrideKey?: CryptoKey
): Promise<string | null> {
  if (!storedValue) return null;

  if (!isEncryptedV1(storedValue)) {
    throw new Error(
      "Data catatan tidak berada dalam format terenkripsi (enc:v1). Data lama wajib dimigrasikan terlebih dahulu."
    );
  }

  if (!analysisId || typeof analysisId !== "string") {
    throw new Error("ID Analysis wajib disertakan untuk verifikasi AAD.");
  }

  const key = overrideKey ?? (await getServerAeadKey());
  const aad = `analysis:${analysisId}:encryptedNotes`;
  const payload = unpackEncryptedPayload(storedValue, aad);
  return decryptAesGcm(payload, key);
}
