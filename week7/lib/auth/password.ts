/**
 * Modul Password Hashing Lambat (Slow Hashing) CyberShield
 * Menggunakan algoritma Scrypt (NIST SP 800-132 / RFC 7914) dengan salt acak CSPRNG
 * dan perbandingan timing-safe untuk mencegah timing attacks dan brute-force.
 */

import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from "node:crypto";

function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey as Buffer);
    });
  });
}

export interface ScryptParams {
  cost: number; // N: CPU/memory cost parameter (16384)
  blockSize: number; // r: block size parameter (8)
  parallelization: number; // p: parallelization parameter (1)
  keyLength: number; // 64 bytes output
}

const DEFAULT_PARAMS: ScryptParams = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64,
};

/**
 * Menghasilkan hash password lambat dengan salt 16-byte acak dari CSPRNG.
 * Format output: `scrypt$N$r$p$saltHex$hashHex`
 */
export async function hashPassword(
  plainText: string,
  params: ScryptParams = DEFAULT_PARAMS
): Promise<string> {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("Password harus berupa teks non-kosong.");
  }

  // 16-byte random salt dari CSPRNG
  const salt = randomBytes(16);

  const derivedKey = (await scryptAsync(plainText, salt, params.keyLength, {
    N: params.cost,
    r: params.blockSize,
    p: params.parallelization,
    maxmem: 32 * 1024 * 1024,
  })) as Buffer;

  return `scrypt$${params.cost}$${params.blockSize}$${params.parallelization}$${salt.toString(
    "hex"
  )}$${derivedKey.toString("hex")}`;
}

/**
 * Memverifikasi kecocokan password terhadap hash yang tersimpan.
 * Menggunakan `timingSafeEqual` untuk mencegah kebocoran waktu komparasi.
 */
export async function verifyPassword(
  plainText: string,
  storedHash: string
): Promise<boolean> {
  if (!plainText || !storedHash) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const cost = parseInt(parts[1], 10);
  const blockSize = parseInt(parts[2], 10);
  const parallelization = parseInt(parts[3], 10);
  const salt = Buffer.from(parts[4], "hex");
  const originalKey = Buffer.from(parts[5], "hex");

  if (salt.length === 0 || originalKey.length === 0) {
    return false;
  }

  try {
    const derivedKey = (await scryptAsync(plainText, salt, originalKey.length, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: 32 * 1024 * 1024,
    })) as Buffer;

    return timingSafeEqual(derivedKey, originalKey);
  } catch {
    return false;
  }
}
