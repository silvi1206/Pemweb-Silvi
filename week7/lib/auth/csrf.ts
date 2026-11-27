import { headers } from "next/headers";

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Mengambil daftar origin kanonikal yang diizinkan oleh server.
 * Mengutamakan variabel lingkungan APP_ORIGIN (mendukung beberapa origin dipisahkan koma).
 * Pada mode non-produksi, mendukung localhost secara default.
 */
export function getCanonicalOrigins(): string[] {
  const envOrigin = process.env.APP_ORIGIN?.trim();
  const validOrigins: string[] = [];

  if (envOrigin) {
    const parts = envOrigin.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      try {
        const parsed = new URL(part);
        validOrigins.push(parsed.origin.toLowerCase());
      } catch {
        // Abaikan entri origin yang tidak valid secara sintaksis
      }
    }
  }

  // Pada lingkungan non-produksi (development / test), sertakan localhost sebagai default
  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || "3000";
    const devOrigins = [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];
    for (const dev of devOrigins) {
      if (!validOrigins.includes(dev)) {
        validOrigins.push(dev);
      }
    }
  }

  return validOrigins;
}

/**
 * Memvalidasi perlindungan CSRF untuk request API yang menggunakan cookie dan melakukan mutasi state.
 * Memvalidasi header Origin (dan fallback Referer) secara ketat terhadap canonical origins server.
 * Tidak mempercayai header X-Forwarded-Host mentah dari klien publik.
 * Menolak request cross-origin yang tidak sah secara fail-closed.
 */
export async function validateCsrf(request?: Request): Promise<CsrfValidationResult> {
  const allowedOrigins = getCanonicalOrigins();

  // Jika pada lingkungan produksi namun APP_ORIGIN tidak terkonfigurasi atau tidak valid
  if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    return {
      valid: false,
      reason: "Konfigurasi server tidak aman: APP_ORIGIN wajib dikonfigurasi dengan benar pada lingkungan produksi.",
    };
  }

  let origin: string | null = null;
  let referer: string | null = null;
  let customCsrfHeader: string | null = null;

  if (request) {
    origin = request.headers.get("origin");
    referer = request.headers.get("referer");
    customCsrfHeader =
      request.headers.get("x-csrf-protection") || request.headers.get("x-requested-with");
  } else {
    try {
      const headerList = await headers();
      origin = headerList.get("origin");
      referer = headerList.get("referer");
      customCsrfHeader =
        headerList.get("x-csrf-protection") || headerList.get("x-requested-with");
    } catch {
      // Di luar HTTP request context
    }
  }

  // 1. Tangani Origin bernilai "null" secara eksplisit (misal dari sandboxed iframe, file://, atau privacy mode)
  if (origin === "null") {
    return {
      valid: false,
      reason: "Permintaan mutasi ditolak: Header Origin 'null' tidak diizinkan.",
    };
  }

  // 2. Jika Origin disertakan, validasi terhadap daftar canonical origins yang diizinkan
  if (origin) {
    try {
      const incomingOrigin = new URL(origin).origin.toLowerCase();
      if (allowedOrigins.includes(incomingOrigin)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Permintaan lintas-asal (Cross-origin) ditolak: Origin "${incomingOrigin}" tidak diizinkan.`,
      };
    } catch {
      return {
        valid: false,
        reason: "Format header Origin tidak valid.",
      };
    }
  }

  // 3. Fallback: Jika Origin tidak ada, validasi header Referer secara ketat
  if (referer) {
    try {
      const incomingRefererOrigin = new URL(referer).origin.toLowerCase();
      if (allowedOrigins.includes(incomingRefererOrigin)) {
        return { valid: true };
      }
      return {
        valid: false,
        reason: `Permintaan lintas-asal ditolak: Origin Referer "${incomingRefererOrigin}" tidak diizinkan.`,
      };
    } catch {
      return {
        valid: false,
        reason: "Format header Referer tidak valid.",
      };
    }
  }

  // 4. Jika Origin dan Referer sama sekali tidak ada
  // Izinkan jika menyertakan custom header anti-CSRF (klien non-browser terotorisasi)
  if (customCsrfHeader) {
    return { valid: true };
  }

  // Fail-closed untuk seluruh request mutasi berbasis cookie tanpa bukti same-origin
  return {
    valid: false,
    reason: "Permintaan mutasi ditolak: Header Origin atau Referer yang valid wajib disertakan untuk proteksi CSRF.",
  };
}
