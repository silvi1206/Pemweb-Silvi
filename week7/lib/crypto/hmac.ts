const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
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

/**
 * Menghasilkan kunci HMAC-SHA-256 acak berukuran 256-bit menggunakan CSPRNG.
 */
export async function generateHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "HMAC",
      hash: "SHA-256",
      length: 256,
    },
    true,
    ["sign", "verify"]
  );
}

/**
 * Mengimpor kunci rahasia HMAC dari string hexadecimal (minimal 256-bit).
 */
export async function importHmacKeyFromHex(hexKey: string): Promise<CryptoKey> {
  const trimmed = hexKey.trim();
  if (trimmed.length < 64) {
    throw new Error(
      "Kunci rahasia HMAC harus berukuran minimal 64 karakter hexadecimal (256-bit)."
    );
  }
  const rawBytes = hexToBytes(trimmed);
  return crypto.subtle.importKey(
    "raw",
    rawBytes as unknown as BufferSource,
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

/**
 * Mengekspor CryptoKey HMAC ke string hexadecimal.
 */
export async function exportHmacKeyToHex(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  return bytesToHex(new Uint8Array(exported));
}

/**
 * Menghitung authentication tag HMAC-SHA-256 dari string input.
 */
export async function createHmac(
  input: string,
  key: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  const signature = await crypto.subtle.sign("HMAC", key, data);

  return bytesToHex(new Uint8Array(signature));
}

/**
 * Memverifikasi authentication tag HMAC-SHA-256 terhadap data asli.
 * Mengembalikan true jika valid, false jika data atau tag dimanipulasi.
 */
export async function verifyHmac(
  input: string,
  hmac: string,
  key: CryptoKey
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  try {
    const signature = hexToBytes(hmac);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signature as unknown as BufferSource,
      data
    );
  } catch {
    return false;
  }
}
