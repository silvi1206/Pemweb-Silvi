import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";

const FEATURES = [
  {
    icon: "🔍",
    title: "Analisis URL",
    description:
      "Periksa keaslian domain, status enkripsi SSL, dan ekstensi file berbahaya dari tautan yang Anda terima.",
  },
  {
    icon: "🛡️",
    title: "Deteksi Phishing",
    description:
      "Identifikasi kata kunci rekayasa sosial dan domain murah yang lazim dipakai untuk serangan phishing massal.",
  },
  {
    icon: "📊",
    title: "Risk Score",
    description:
      "Dapatkan skor risiko keamanan berdasarkan beberapa indikator analisis untuk menilai tingkat bahaya tautan.",
  },
  {
    icon: "⚡",
    title: "Rekomendasi Instan",
    description:
      "Terima saran keamanan langsung setelah analisis untuk membantu Anda mengambil keputusan yang tepat.",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <HeroSection />

      {/* Problem Statement */}
      <section aria-labelledby="problem-heading" className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80">
            <span>⚠️</span>
            <span>Ancaman Siber Nyata</span>
          </div>
          <h2
            id="problem-heading"
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
          >
            Mengapa Phishing <span className="text-pink-600">Sangat Berbahaya?</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Phishing adalah kejahatan siber di mana penipu menyamar sebagai
            institusi resmi (bank, kurir, atau rekan kerja) untuk memancing Anda
            memberikan kata sandi, OTP, atau nomor rekening. Satu klik ceroboh
            bisa mengakibatkan pencurian data pribadi, kerugian finansial, dan
            pembajakan akun digital.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section aria-labelledby="how-heading" className="pb-12 sm:pb-16">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-extrabold uppercase tracking-wider text-pink-600">
            Fitur Utama
          </span>
          <h2
            id="how-heading"
            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
          >
            Bagaimana CyberShield Bekerja?
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            CyberShield menganalisis URL menggunakan indikator keamanan berbasis rule
            untuk mendeteksi potensi phishing dan manipulasi rekayasa sosial.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        aria-labelledby="cta-heading"
        className="pb-16 sm:pb-20"
      >
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 text-white text-center space-y-4 shadow-xl shadow-pink-200/60 border border-pink-400/30 relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3 relative z-10">
            <h2
              id="cta-heading"
              className="text-2xl sm:text-3xl font-black tracking-tight"
            >
              Siap Memeriksa Keamanan URL?
            </h2>
            <p className="text-sm text-pink-100 leading-relaxed">
              Masukkan tautan mencurigakan yang Anda terima melalui SMS,
              WhatsApp, atau email dan dapatkan analisis keamanan instan.
            </p>
            <div className="pt-2">
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm bg-white text-pink-700 hover:bg-pink-50 shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600 active:scale-[0.99]"
              >
                Mulai Analisis
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
          </div>
        </div>
      </section>
    </div>
  );
}
