import "dotenv/config";
import { createHash, createHmac, createCipheriv, randomBytes, randomUUID, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * Format penyimpanan terenkripsi berversi CyberShield (v1).
 * Menggunakan AES-256-GCM dengan IV 96-bit CSPRNG dan tag 128-bit.
 */
function encryptNoteForSeed(plaintext: string, analysisId: string, hexKey: string): string {
  const keyBuffer = Buffer.from(hexKey, "hex");
  const iv = randomBytes(12); // 96-bit CSPRNG IV
  const cipher = createCipheriv("aes-256-gcm", keyBuffer, iv);
  const aad = Buffer.from(`analysis:${analysisId}:encryptedNotes`, "utf8");
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte (128-bit) GCM tag
  return `enc:v1:${iv.toString("hex")}:${tag.toString("hex")}:${ciphertext.toString("hex")}`;
}

function hashPasswordForSeed(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

interface SeedUserData {
  email: string;
  name: string;
  password: string;
  role: string;
}

const SEED_USERS: SeedUserData[] = [
  {
    email: "user.demo@cybershield.test",
    name: "Demo User",
    password: "DemoUser#2026!",
    role: "user",
  },
  {
    email: "admin.sec@cybershield.test",
    name: "Cyber Admin",
    password: "CyberAdmin#Secret2026",
    role: "admin",
  },
];

interface SeedAnalysisData {
  url: string;
  riskScore: number;
  isSafe: boolean;
  recommendation: string;
  encryptedNotes?: string;
  indicators: Array<{
    type: string;
    status: string;
    isAlert: boolean;
    detail: string;
  }>;
}

const SEED_DATA: SeedAnalysisData[] = [
  {
    url: "https://klikbca.com/login",
    riskScore: 0,
    isSafe: true,
    recommendation:
      "Tautan terindikasi aman dari reputasi domain dan enkripsi. Namun tetap berhati-hati jangan pernah membocorkan kode OTP.",
    encryptedNotes: "Domain perbankan resmi terdaftar dalam whitelist internal CyberShield.",
    indicators: [
      {
        type: "PROTOCOL",
        status: "HTTPS",
        isAlert: false,
        detail: "HTTPS Terenkripsi (Sertifikat SSL Aktif)",
      },
      {
        type: "DOMAIN",
        status: "Standar",
        isAlert: false,
        detail: "Domain resmi terpercaya (terdaftar dalam whitelist resmi)",
      },
      {
        type: "KEYWORD",
        status: "Nihil",
        isAlert: false,
        detail: "Tidak ditemukan kata umpan hadiah atau pemaksaan verifikasi.",
      },
      {
        type: "EXTENSION",
        status: "Bersih",
        isAlert: false,
        detail: "Tidak terdeteksi unduhan berkas executable yang mencurigakan.",
      },
    ],
  },
  {
    url: "http://bca-klaim-hadiah-gebyar.xyz/login.php",
    riskScore: 95,
    isSafe: false,
    recommendation:
      "JANGAN KLIK! Tautan ini memiliki ciri khas domain tiruan (phishing). Tutup halaman dan jangan masukkan kredensial atau unduh berkas apapun.",
    encryptedNotes: "Terdeteksi pola spoofing merek bank dengan TLD berbiaya murah (.xyz).",
    indicators: [
      {
        type: "PROTOCOL",
        status: "HTTP",
        isAlert: true,
        detail: "HTTP Tidak Terenkripsi (Komunikasi teks terbuka rawan intersepsi)",
      },
      {
        type: "DOMAIN",
        status: "Mencurigakan",
        isAlert: true,
        detail: "Menggunakan domain ekstensi berbiaya murah yang lazim dipakai serangan massal (.xyz)",
      },
      {
        type: "KEYWORD",
        status: "Terdeteksi",
        isAlert: true,
        detail: 'Kata pancingan rekayasa sosial ditemukan: "klaim, hadiah, gebyar"',
      },
      {
        type: "EXTENSION",
        status: "Bersih",
        isAlert: false,
        detail: "Target berupa skrip PHP, bukan muatan unduhan biner.",
      },
    ],
  },
  {
    url: "http://surat-undangan-nikah-digital.online/update.apk",
    riskScore: 98,
    isSafe: false,
    recommendation:
      "BAHAYA TINGGI! Tautan mengarah langsung ke muatan file APK berbahaya (Sniffer/Trojan). Jangan instal berkas ini pada perangkat Anda.",
    encryptedNotes: "Modus penipuan undangan pernikahan digital berkedok berkas APK pencuri SMS/OTP.",
    indicators: [
      {
        type: "PROTOCOL",
        status: "HTTP",
        isAlert: true,
        detail: "HTTP Tidak Terenkripsi (Komunikasi tidak aman)",
      },
      {
        type: "DOMAIN",
        status: "Mencurigakan",
        isAlert: true,
        detail: "Menggunakan TLD berbiaya murah (.online) yang baru didaftarkan",
      },
      {
        type: "KEYWORD",
        status: "Terdeteksi",
        isAlert: true,
        detail: 'Kata pancingan terdeteksi: "undangan-nikah, update-akun"',
      },
      {
        type: "EXTENSION",
        status: "Bahaya",
        isAlert: true,
        detail: "Tautan mengarah ke unduhan berkas APK (potensi malware pencuri data OTP/SMS)",
      },
    ],
  },
  {
    url: "https://portal-akademik-universitas.ac.id",
    riskScore: 5,
    isSafe: true,
    recommendation:
      "Tautan portal akademik resmi institusi pendidikan tinggi. Aman diakses untuk keperluan perkuliahan.",
    encryptedNotes: "Record analisis tanpa indikator berelasi untuk pengujian skenario hapus item Modul 7.",
    indicators: [],
  },
];

export async function main() {
  console.log("Memulai proses seeding database sintetis CyberShield...");

  const secretKey = process.env.HMAC_SECRET_KEY || randomBytes(32).toString("hex");
  const aeadKeyHex =
    process.env.AEAD_ENCRYPTION_KEY_HEX || process.env.ENCRYPTION_KEY;

  if (!aeadKeyHex || aeadKeyHex.trim().length !== 64) {
    throw new Error(
      "AEAD_ENCRYPTION_KEY_HEX tidak dikonfigurasi dengan benar (wajib 64 karakter hex / 256-bit di .env). Seeding dihentikan demi keamanan."
    );
  }

  let adminUserId: string | null = null;
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PRODUCTION_SEED) {
    console.warn("[SECURITY] Seeding akun demo dibatalkan di lingkungan produksi demi mencegah penyebaran kredensial default.");
  } else {
    console.log("Memulai seeding akun pengguna sintetis (User dan Admin)...");
    for (const u of SEED_USERS) {
      const existingUser = await prisma.user.findUnique({
        where: { email: u.email },
      });
      const hash = hashPasswordForSeed(u.password);
      if (existingUser) {
        console.log(`- Memperbarui akun sintetis: ${u.email} (${u.role})`);
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: u.name,
            role: u.role,
            passwordHash: hash,
          },
        });
        if (u.role === "admin") adminUserId = updated.id;
      } else {
        console.log(`+ Membuat akun sintetis baru: ${u.email} (${u.role})`);
        const created = await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash: hash,
          },
        });
        if (u.role === "admin") adminUserId = created.id;
      }
    }
  }

  for (const item of SEED_DATA) {
    const hash = createHash("sha256").update(item.url).digest("hex");
    const signatureData = JSON.stringify({
      url: item.url,
      riskScore: item.riskScore,
      isSafe: item.isSafe,
      recommendation: item.recommendation,
    });
    const hmacTag = createHmac("sha256", secretKey).update(signatureData).digest("hex");

    // Cari apakah data dengan URL yang sama sudah ada untuk menjaga idempotenitas
    const existing = await prisma.analysis.findFirst({
      where: { url: item.url },
      include: { indicators: true },
    });

    if (existing) {
      console.log(`- Memperbarui data yang sudah ada: ${item.url}`);

      // Enkripsi catatan dengan AAD terikat pada ID record
      let cipherNotes: string | null = null;
      if (item.encryptedNotes && item.encryptedNotes.trim()) {
        cipherNotes = encryptNoteForSeed(item.encryptedNotes.trim(), existing.id, aeadKeyHex);
      }

      await prisma.analysis.update({
        where: { id: existing.id },
        data: {
          riskScore: item.riskScore,
          isSafe: item.isSafe,
          recommendation: item.recommendation,
          sha256: hash,
          hmac: hmacTag,
          encryptedNotes: cipherNotes,
          userId: existing.userId ?? adminUserId,
        },
      });

      // Sinkronisasi indikator jika belum ada
      if (existing.indicators.length === 0) {
        await prisma.analysisIndicator.createMany({
          data: item.indicators.map((ind) => ({
            analysisId: existing.id,
            type: ind.type,
            status: ind.status,
            isAlert: ind.isAlert,
            detail: ind.detail,
          })),
        });
      }
    } else {
      console.log(`+ Membuat data analisis baru berserta relasi indikator: ${item.url}`);
      const newId = randomUUID();

      let cipherNotes: string | null = null;
      if (item.encryptedNotes && item.encryptedNotes.trim()) {
        cipherNotes = encryptNoteForSeed(item.encryptedNotes.trim(), newId, aeadKeyHex);
      }

      await prisma.analysis.create({
        data: {
          id: newId,
          url: item.url,
          riskScore: item.riskScore,
          isSafe: item.isSafe,
          recommendation: item.recommendation,
          sha256: hash,
          hmac: hmacTag,
          encryptedNotes: cipherNotes,
          userId: adminUserId,
          indicators: {
            create: item.indicators.map((ind) => ({
              type: ind.type,
              status: ind.status,
              isAlert: ind.isAlert,
              detail: ind.detail,
            })),
          },
        },
      });
    }
  }

  const totalAnalysis = await prisma.analysis.count();
  const totalIndicators = await prisma.analysisIndicator.count();
  console.log(`Seeding selesai. Total Analysis: ${totalAnalysis}, Total Indicators: ${totalIndicators}`);
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
