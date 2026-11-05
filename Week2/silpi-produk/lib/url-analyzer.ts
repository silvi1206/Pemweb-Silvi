import type { AnalysisResult, SampleUrl } from "@/types/analysis";

// Sample URLs for demonstration purposes
export const SAMPLE_URLS: SampleUrl[] = [
  {
    name: "KlikBCA Resmi",
    url: "https://klikbca.com/login",
    type: "safe",
    category: "Perbankan Resmi",
  },
  {
    name: "Tiruan Bank (Hadiah Gebyar)",
    url: "http://bca-klaim-hadiah-gebyar.xyz/login.php",
    type: "phishing",
    category: "Phishing Finansial",
  },
  {
    name: "Undangan WhatsApp Palsu (APK)",
    url: "http://surat-undangan-nikah-digital.online/update.apk",
    type: "phishing",
    category: "Malware & Phishing APK",
  },
  {
    name: "Dana Kaget Palsu",
    url: "http://klaim-saldo-dana-kaget-gratis.site/verifikasi",
    type: "phishing",
    category: "Social Engineering",
  },
  {
    name: "Portal Kominfo Resmi",
    url: "https://kemkominfo.go.id/keamanan-siber",
    type: "safe",
    category: "Layanan Publik Resmi",
  },
];

// Suspicious TLDs commonly used in phishing attacks
const SUSPICIOUS_TLDS = [
  ".xyz",
  ".online",
  ".site",
  ".top",
  ".cc",
  ".tk",
  ".fun",
  ".pw",
  ".bid",
];

// Keywords indicative of social engineering / phishing lures
const RISK_KEYWORDS = [
  "klaim",
  "hadiah",
  "gebyar",
  "gratis",
  "kaget",
  "verifikasi",
  "update-akun",
  "undangan-nikah",
  "apk-download",
  "saldo",
];

// File extensions that indicate potential malware downloads
const DANGEROUS_EXTENSIONS = [".apk", ".exe", ".bat", ".scr", ".zip"];

// Whitelisted domains considered safe when used with HTTPS
const OFFICIAL_WHITELIST = [
  "klikbca.com",
  "kemkominfo.go.id",
  "instagram.com",
  "google.com",
  "bankmandiri.co.id",
];

/**
 * Validates whether a string is a plausible URL format.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateUrl(url: string): string | null {
  const trimmed = url.trim();

  if (!trimmed) {
    return "URL tidak boleh kosong. Masukkan URL yang ingin diperiksa.";
  }

  // Check basic URL pattern (must start with http:// or https://)
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    return "Format URL tidak valid. URL harus diawali dengan http:// atau https://";
  }

  // Check that there's at least a domain-like structure after the protocol
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return "URL harus memiliki nama domain yang valid (contoh: example.com).";
    }
  } catch {
    return "Format URL tidak valid. Pastikan URL yang dimasukkan benar.";
  }

  return null;
}

/**
 * Performs client-side URL security analysis using rule-based indicators.
 * This is a prototype/educational analysis — not a real security scanner.
 */
export function analyzeUrl(urlToTest: string): AnalysisResult {
  const lower = urlToTest.toLowerCase().trim();
  const isHttps = lower.startsWith("https://");

  // Suspicious TLD detection
  const hasSuspiciousTld = SUSPICIOUS_TLDS.some((tld) => lower.includes(tld));

  // Suspicious keyword detection
  const foundKeywords = RISK_KEYWORDS.filter((kw) => lower.includes(kw));

  // Dangerous file extension detection
  const foundExt =
    DANGEROUS_EXTENSIONS.find(
      (ext) => lower.endsWith(ext) || lower.includes(`${ext}?`)
    ) || "";

  // Calculate risk score
  let riskScore = 0;
  if (!isHttps) riskScore += 35;
  if (hasSuspiciousTld) riskScore += 30;
  if (foundKeywords.length > 0)
    riskScore += Math.min(foundKeywords.length * 15, 30);
  if (foundExt) riskScore += 30;

  // Whitelisted domain check
  const isWhitelisted =
    OFFICIAL_WHITELIST.some((domain) => lower.includes(domain)) &&
    isHttps &&
    !hasSuspiciousTld &&
    foundKeywords.length === 0;

  if (isWhitelisted) {
    riskScore = 0;
  } else {
    riskScore = Math.min(Math.max(riskScore, 15), 98);
  }

  const isSafe = riskScore < 30;

  return {
    url: urlToTest,
    isSafe,
    riskScore,
    protocol: {
      isHttps,
      detail: isHttps
        ? "HTTPS Terenkripsi (Sertifikat SSL Aktif)"
        : "HTTP Tidak Terenkripsi (Komunikasi teks terbuka rawan intersepsi)",
    },
    domainCheck: {
      isSuspicious: hasSuspiciousTld,
      detail: hasSuspiciousTld
        ? "Menggunakan domain ekstensi berbiaya murah yang lazim dipakai serangan massal (.xyz/.site/.online)"
        : "Domain tergolong menggunakan standar umum.",
    },
    keywordCheck: {
      isTriggered: foundKeywords.length > 0,
      keywords: foundKeywords,
    },
    extensionCheck: {
      isDangerous: Boolean(foundExt),
      ext: foundExt,
    },
    recommendation: isSafe
      ? "Tautan terindikasi aman dari reputasi domain dan enkripsi. Namun tetap berhati-hati jangan pernah membocorkan kode OTP."
      : "JANGAN KLIK! Tautan ini memiliki ciri khas domain tiruan (phishing). Tutup halaman dan jangan masukkan kredensial atau unduh berkas apapun.",
  };
}
