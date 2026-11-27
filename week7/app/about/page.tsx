import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Pelajari cara kerja CyberShield, indikator analisis yang digunakan, dan limitasi sistem prototype ini.",
};

const INDICATORS = [
  {
    title: "Protokol HTTPS",
    description:
      "Memeriksa apakah URL menggunakan HTTPS (terenkripsi) atau HTTP biasa. URL tanpa HTTPS lebih rentan terhadap intersepsi data.",
    impact: "+35 risk score jika HTTP",
  },
  {
    title: "Domain/TLD Mencurigakan",
    description:
      "Mendeteksi penggunaan Top-Level Domain (TLD) berbiaya murah seperti .xyz, .online, .site, .top, .cc, .tk, .fun, .pw, dan .bid yang sering digunakan untuk serangan phishing massal.",
    impact: "+30 risk score jika TLD mencurigakan",
  },
  {
    title: "Kata Kunci Rekayasa Sosial",
    description:
      'Mengidentifikasi kata-kata yang lazim digunakan dalam tautan phishing seperti "klaim", "hadiah", "gratis", "kaget", "verifikasi", dan sejenisnya yang bertujuan memancing korban.',
    impact: "+15 risk score per kata kunci (maks +30)",
  },
  {
    title: "Ekstensi File Berbahaya",
    description:
      "Mendeteksi apakah URL mengarah ke unduhan file yang berpotensi berbahaya seperti .apk, .exe, .bat, .scr, atau .zip yang dapat mengandung malware.",
    impact: "+30 risk score jika ditemukan",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* What is CyberShield */}
      <section aria-labelledby="about-heading" className="space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80 shadow-2xs">
          <span>🛡️</span>
          <span>Edukasi Keamanan Siber</span>
        </span>
        <h1
          id="about-heading"
          className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
        >
          Tentang Cyber<span className="text-pink-600">Shield</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          CyberShield adalah platform yang membantu pengguna melakukan
          pemeriksaan awal terhadap tautan atau URL mencurigakan,
          khususnya yang berindikasi penipuan rekayasa sosial dan phishing. Produk ini dikembangkan sebagai
          bagian dari tugas mata kuliah Pengembangan Aplikasi Web.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Tujuan utama CyberShield adalah memberikan edukasi kepada pengguna
          tentang ciri-ciri teknis tautan phishing dan membantu mereka membuat
          keputusan yang lebih aman sebelum mengklik tautan yang tidak
          dikenal.
        </p>
      </section>

      {/* How Analysis Works */}
      <section aria-labelledby="process-heading" className="space-y-4">
        <h2
          id="process-heading"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          Cara Kerja Analisis
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Ketika pengguna memasukkan URL, CyberShield melakukan analisis
          menggunakan beberapa indikator keamanan berbasis rule. Sistem
          memeriksa URL terhadap sejumlah pola dan memberikan skor risiko
          berdasarkan temuan.
        </p>

        {/* Process Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {[
            { step: "1", label: "Input URL", desc: "Pengguna memasukkan URL yang ingin diperiksa" },
            { step: "2", label: "Analisis Rule-Based", desc: "Sistem memeriksa URL terhadap beberapa indikator" },
            { step: "3", label: "Hitung Risk Score", desc: "Skor risiko dihitung dari hasil indikator" },
            { step: "4", label: "Rekomendasi", desc: "Sistem memberikan hasil dan saran keamanan" },
          ].map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-2xl bg-white border border-pink-100 shadow-2xs text-center hover:border-pink-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-2xs">
                {item.step}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {item.label}
              </h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Indicators */}
      <section aria-labelledby="indicators-heading" className="space-y-4">
        <h2
          id="indicators-heading"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          Indikator Analisis
        </h2>
        <p className="text-sm text-slate-600">
          Berikut adalah indikator yang digunakan CyberShield untuk
          menganalisis keamanan URL:
        </p>

        <div className="space-y-3">
          {INDICATORS.map((indicator) => (
            <div
              key={indicator.title}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-pink-100/90 shadow-2xs hover:border-pink-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {indicator.title}
                </h3>
                <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 self-start">
                  {indicator.impact}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {indicator.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Score Explanation */}
      <section aria-labelledby="score-heading" className="space-y-4">
        <h2
          id="score-heading"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          Memahami Risk Score
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-2xl font-black text-emerald-600 mb-1">
              0 — 29%
            </p>
            <p className="text-sm font-bold text-emerald-800">Aman</p>
            <p className="text-xs text-emerald-700 mt-1">
              URL tidak menunjukkan indikator phishing yang signifikan.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-2xl font-black text-amber-600 mb-1">
              30 — 69%
            </p>
            <p className="text-sm font-bold text-amber-800">Mencurigakan</p>
            <p className="text-xs text-amber-700 mt-1">
              Ditemukan beberapa indikator yang patut diwaspadai.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-2xl font-black text-red-600 mb-1">
              70 — 100%
            </p>
            <p className="text-sm font-bold text-red-800">Bahaya Tinggi</p>
            <p className="text-xs text-red-700 mt-1">
              Tautan sangat mencurigakan dan kemungkinan besar phishing.
            </p>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section aria-labelledby="limitations-heading" className="space-y-4">
        <h2
          id="limitations-heading"
          className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
        >
          Limitasi Sistem
        </h2>
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
          <p className="text-sm text-amber-900 font-semibold">
            ⚠️ Penting untuk dipahami:
          </p>
          <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
            <li>
              CyberShield saat ini adalah <strong>prototype</strong> yang
              menggunakan analisis berbasis rule sederhana di sisi
              client (frontend).
            </li>
            <li>
              Sistem <strong>tidak</strong> melakukan scanning malware
              sesungguhnya, pengecekan sertifikat SSL aktual, atau lookup
              database phishing real-time.
            </li>
            <li>
              Hasil analisis bersifat <strong>edukatif</strong> dan tidak
              menggantikan solusi keamanan profesional seperti antivirus
              atau layanan threat intelligence.
            </li>
            <li>
              Domain yang terdeteksi &quot;aman&quot; tidak menjamin keamanan
              100% — selalu berhati-hati dengan tautan dari sumber tidak
              dikenal.
            </li>
            <li>
              Pengembangan lebih lanjut (integrasi API keamanan, database
              phishing, dll.) direncanakan untuk milestone berikutnya.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-4">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-pink-100 shadow-2xs text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            Ingin mencoba menganalisis URL?
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-200/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            Buka Halaman Analyze
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

