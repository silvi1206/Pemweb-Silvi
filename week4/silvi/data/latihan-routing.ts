export interface LatihanItem {
  id: string;
  name: string;
  category: string;
  description: string;
  details?: string;
  features?: string[];
}

export const LATIHAN_ITEMS: LatihanItem[] = [
  {
    id: "1",
    name: "Analisis URL Demo",
    category: "Pemeriksaan Tautan",
    description:
      "Modul demo untuk mensimulasikan alur verifikasi protokol, struktur domain, dan kredibilitas URL web.",
    details:
      "Studi kasus ini mendemonstrasikan evaluasi awal terhadap tautan web mencurigakan dengan memeriksa parameter SSL/TLS dan struktur domain tingkat atas.",
    features: [
      "Pemeriksaan protokol HTTP vs HTTPS",
      "Pendeteksian pola sub-domain berlebih",
      "Pemeriksaan whitelist domain terpercaya",
    ],
  },
  {
    id: "2",
    name: "Analisis File Demo",
    category: "Keamanan Berkas",
    description:
      "Modul demo untuk mengenali ekstensi berkas berisiko tinggi yang berpotensi menyamarkan muatan berbahaya.",
    details:
      "Studi kasus ini mengidentifikasi file unduhan berisiko seperti .apk, .exe, atau .scr yang kerap digunakan sebagai metode penetrasi ke perangkat korban.",
    features: [
      "Deteksi ekstensi executable berbahaya",
      "Peringatan bahaya berkas installer Android (.apk)",
      "Inspeksi ekstensi ganda (double extension)",
    ],
  },
  {
    id: "3",
    name: "Pemeriksaan Phishing Demo",
    category: "Rekayasa Sosial",
    description:
      "Modul demo untuk mendeteksi kata-kata pancingan psikologis dan manipulasi emosional pada pesan tautan.",
    details:
      "Studi kasus ini mengulas ciri khas penipuan rekayasa sosial yang memakai taktik urgensi, iming-iming hadiah, atau ancaman pemblokiran akun.",
    features: [
      "Pendeteksian kata kunci pancingan (klaim, hadiah, gratis)",
      "Identifikasi indikasi phishing perbankan",
      "Peringatan bahaya pencurian kode OTP",
    ],
  },
  {
    id: "4",
    name: "Pemeriksaan Malware Demo",
    category: "Deteksi Ancaman",
    description:
      "Modul demo untuk memahami pola distribusi program berbahaya melalui tautan internet tanpa otorisasi.",
    details:
      "Studi kasus ini mengilustrasikan mekanisme distribusi malware berbasis web dan pentingnya tidak mengunduh berkas dari sumber yang tidak diverifikasi.",
    features: [
      "Pendeteksian domain pengirim muatan malware",
      "Analisis jalur pengunduhan otomatis (drive-by download)",
      "Panduan mitigasi isolasi perangkat terinfeksi",
    ],
  },
  {
    id: "5",
    name: "Pemeriksaan Keamanan Demo",
    category: "Audit & Integritas",
    description:
      "Modul demo untuk menguji penerapan verifikasi integritas data dan prinsip proteksi berlapis.",
    details:
      "Studi kasus ini menekankan pentingnya menjaga integritas hasil pemeriksaan menggunakan hashing (SHA-256) dan otentikasi pesan (HMAC).",
    features: [
      "Pembuatan fingerprint identifikasi (SHA-256)",
      "Verifikasi tag otentikasi data (HMAC-SHA-256)",
      "Pemeriksaan integritas aturan deteksi",
    ],
  },
];

export function getAllLatihanItems(): LatihanItem[] {
  return LATIHAN_ITEMS;
}

export function getLatihanItemById(id: string): LatihanItem | undefined {
  return LATIHAN_ITEMS.find((item) => item.id === id);
}

export function getAdjacentLatihanItemIds(currentId: string): {
  prevId: string | null;
  nextId: string | null;
} {
  const currentIndex = LATIHAN_ITEMS.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) {
    return { prevId: null, nextId: null };
  }

  const prevId = currentIndex > 0 ? LATIHAN_ITEMS[currentIndex - 1].id : null;
  const nextId =
    currentIndex < LATIHAN_ITEMS.length - 1
      ? LATIHAN_ITEMS[currentIndex + 1].id
      : null;

  return { prevId, nextId };
}

